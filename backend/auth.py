"""用户认证模块（SQLite + PBKDF2 + token）。

设计要点：
- 纯标准库实现，不引入新依赖
- 密码用 PBKDF2-HMAC-SHA256 + 16 字节 per-user salt，迭代 12 万次
- session token 用 secrets.token_urlsafe(32)，存数据库，7 天有效期
- 用户名 UNIQUE 约束 → 注册重名直接 sqlite IntegrityError → 上层转 409

接口：
  init_db()
  register_user(username, password)   -> dict | raises UsernameTakenError
  verify_password(username, password) -> int user_id | None
  create_session(user_id)             -> token
  get_session_user(token)             -> dict {id, username} | None
  delete_session(token)
"""
from __future__ import annotations

import hashlib
import secrets
import sqlite3
import threading
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

# DB 路径由 config 决定，但为了避免循环 import，运行时再读
_DB_PATH: Path | None = None
_init_lock = threading.Lock()
_initialized = False

PBKDF2_ITER = 120_000
SESSION_TTL_DAYS = 7
USERNAME_MIN = 2
USERNAME_MAX = 32
PASSWORD_MIN = 6
PASSWORD_MAX = 128


class UsernameTakenError(Exception):
    pass


class InvalidCredentialError(ValueError):
    pass


def set_db_path(path: Path) -> None:
    global _DB_PATH
    _DB_PATH = Path(path)


def _conn() -> sqlite3.Connection:
    if _DB_PATH is None:
        raise RuntimeError("auth.set_db_path() not called before use")
    _DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    c = sqlite3.connect(str(_DB_PATH))
    c.row_factory = sqlite3.Row
    c.execute("PRAGMA foreign_keys = ON")
    return c


def init_db() -> None:
    """幂等初始化：建表、清过期 session。"""
    global _initialized
    with _init_lock:
        if _initialized:
            return
        with _conn() as c:
            c.executescript(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
                    password_hash TEXT NOT NULL,
                    salt TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS sessions (
                    token TEXT PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    expires_at TEXT NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
                """
            )
            # 清过期 session
            c.execute(
                "DELETE FROM sessions WHERE expires_at < ?",
                (datetime.now(timezone.utc).isoformat(),),
            )
        _initialized = True


def _hash(password: str, salt_hex: str) -> str:
    return hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        bytes.fromhex(salt_hex),
        PBKDF2_ITER,
    ).hex()


def _validate(username: str, password: str) -> None:
    if not username or len(username) < USERNAME_MIN or len(username) > USERNAME_MAX:
        raise InvalidCredentialError(
            f"用户名长度需在 {USERNAME_MIN}-{USERNAME_MAX} 字符之间"
        )
    if any(ch in username for ch in " \t\n\r"):
        raise InvalidCredentialError("用户名不能包含空白字符")
    if not password or len(password) < PASSWORD_MIN or len(password) > PASSWORD_MAX:
        raise InvalidCredentialError(
            f"密码长度需在 {PASSWORD_MIN}-{PASSWORD_MAX} 字符之间"
        )


def register_user(username: str, password: str) -> dict:
    """成功 → {id, username}；用户名冲突 → UsernameTakenError；其他 → InvalidCredentialError."""
    init_db()
    _validate(username, password)
    salt = secrets.token_bytes(16).hex()
    pw_hash = _hash(password, salt)
    created = datetime.now(timezone.utc).isoformat()
    try:
        with _conn() as c:
            cur = c.execute(
                "INSERT INTO users (username, password_hash, salt, created_at) VALUES (?, ?, ?, ?)",
                (username, pw_hash, salt, created),
            )
            uid = cur.lastrowid
    except sqlite3.IntegrityError as e:
        raise UsernameTakenError(f"用户名 {username!r} 已被占用") from e
    return {"id": uid, "username": username}


def verify_password(username: str, password: str) -> int | None:
    """返回 user_id 或 None。不区分用户名错误 vs 密码错误，避免账户枚举。"""
    init_db()
    with _conn() as c:
        row = c.execute(
            "SELECT id, password_hash, salt FROM users WHERE username = ? COLLATE NOCASE",
            (username,),
        ).fetchone()
    if row is None:
        # 走一次 hash 防止时序攻击泄露用户名存在性
        _hash(password, "00" * 16)
        return None
    expected = _hash(password, row["salt"])
    if secrets.compare_digest(expected, row["password_hash"]):
        return int(row["id"])
    return None


def create_session(user_id: int) -> str:
    """生成新 token 写入 sessions 表，返回 token 字符串。"""
    init_db()
    token = secrets.token_urlsafe(32)
    expires = (datetime.now(timezone.utc) + timedelta(days=SESSION_TTL_DAYS)).isoformat()
    with _conn() as c:
        c.execute(
            "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
            (token, user_id, expires),
        )
    return token


def get_session_user(token: str) -> dict | None:
    """token 有效 → {id, username}；无效/过期 → None。"""
    if not token:
        return None
    init_db()
    now = datetime.now(timezone.utc).isoformat()
    with _conn() as c:
        row = c.execute(
            """
            SELECT u.id, u.username, s.expires_at
            FROM sessions s JOIN users u ON u.id = s.user_id
            WHERE s.token = ? AND s.expires_at > ?
            """,
            (token, now),
        ).fetchone()
    if row is None:
        return None
    return {"id": int(row["id"]), "username": row["username"]}


def delete_session(token: str) -> None:
    if not token:
        return
    init_db()
    with _conn() as c:
        c.execute("DELETE FROM sessions WHERE token = ?", (token,))


def gc_expired_sessions() -> int:
    init_db()
    now = datetime.now(timezone.utc).isoformat()
    with _conn() as c:
        cur = c.execute("DELETE FROM sessions WHERE expires_at < ?", (now,))
        return cur.rowcount
