"""Tiny SSH driver for one-shot deployment on Vultr.

Streams stdout/stderr of each remote command. Not committed-quality, just glue.
Password is read from env DEPLOY_PASS to avoid baking it into git history.
"""
from __future__ import annotations

import os
import sys
import time

import paramiko

HOST = os.environ.get("DEPLOY_HOST", "149.28.235.226")
USER = os.environ.get("DEPLOY_USER", "root")
PASS = os.environ.get("DEPLOY_PASS")
PORT = int(os.environ.get("DEPLOY_PORT", "22"))

if not PASS:
    print("ERROR: set DEPLOY_PASS env var first", file=sys.stderr)
    sys.exit(2)


def connect() -> paramiko.SSHClient:
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, port=PORT, username=USER, password=PASS, timeout=30, banner_timeout=30, auth_timeout=30)
    return c


def run(client: paramiko.SSHClient, cmd: str, *, label: str | None = None, timeout: int = 300) -> int:
    print(f"\n\033[1;36m$ {label or cmd}\033[0m")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout, get_pty=False)
    chan = stdout.channel
    chan.settimeout(timeout)
    while True:
        if chan.recv_ready():
            sys.stdout.buffer.write(chan.recv(65536))
            sys.stdout.flush()
        if chan.recv_stderr_ready():
            sys.stderr.buffer.write(chan.recv_stderr(65536))
            sys.stderr.flush()
        if chan.exit_status_ready() and not chan.recv_ready() and not chan.recv_stderr_ready():
            break
        time.sleep(0.05)
    # drain
    while chan.recv_ready():
        sys.stdout.buffer.write(chan.recv(65536))
    while chan.recv_stderr_ready():
        sys.stderr.buffer.write(chan.recv_stderr(65536))
    sys.stdout.flush()
    sys.stderr.flush()
    rc = chan.recv_exit_status()
    print(f"[exit {rc}]")
    return rc


def put(client: paramiko.SSHClient, local_path: str, remote_path: str) -> None:
    print(f"\n\033[1;33m$ scp {local_path} -> {remote_path}\033[0m")
    sftp = client.open_sftp()
    try:
        sftp.put(local_path, remote_path)
    finally:
        sftp.close()


def main() -> None:
    args = sys.argv[1:]
    if not args:
        print("usage: ssh_run.py <step1> [step2 ...]  (steps: ping | deploy | restart | logs | tail | nginx)")
        sys.exit(2)

    client = connect()
    try:
        for step in args:
            handler = STEPS.get(step)
            if handler is None:
                print(f"unknown step: {step}", file=sys.stderr)
                sys.exit(2)
            handler(client)
    finally:
        client.close()


# steps are wired in the deploy.py script; keep this file generic
STEPS: dict[str, "callable"] = {}


def register(name: str):
    def deco(fn):
        STEPS[name] = fn
        return fn

    return deco


@register("ping")
def _ping(client: paramiko.SSHClient) -> None:
    run(client, "uname -a; cat /etc/os-release | head -3; whoami; pwd; date -u", label="hello")


@register("install")
def _install(client: paramiko.SSHClient) -> None:
    here = os.path.dirname(os.path.abspath(__file__))
    put(client, os.path.join(here, "_remote_install.sh"), "/root/_remote_install.sh")
    run(client, "chmod +x /root/_remote_install.sh && /root/_remote_install.sh 2>&1", label="install", timeout=900)


@register("restart")
def _restart(client: paramiko.SSHClient) -> None:
    run(client, "systemctl restart douyin-backend && systemctl status douyin-backend --no-pager | head -15")


@register("logs")
def _logs(client: paramiko.SSHClient) -> None:
    run(client, "journalctl -u douyin-backend -n 80 --no-pager")


@register("pull")
def _pull(client: paramiko.SSHClient) -> None:
    run(
        client,
        "cd /opt/douyin-ai-hackathon && git fetch origin main && git reset --hard origin/main && "
        "/opt/douyin-ai-hackathon/.venv/bin/pip install -r backend/requirements.txt && "
        "systemctl restart douyin-backend && systemctl status douyin-backend --no-pager | head -15",
        label="pull+restart",
        timeout=600,
    )


@register("check")
def _check(client: paramiko.SSHClient) -> None:
    run(client, "curl -fsS http://127.0.0.1:8000/healthz; echo; curl -fsS http://127.0.0.1/healthz; echo")


@register("inspect")
def _inspect(client: paramiko.SSHClient) -> None:
    run(
        client,
        "echo '--- hackathon site ---'; cat /etc/nginx/sites-available/hackathon 2>/dev/null || echo 'not found'; "
        "echo '--- sqtp site ---'; cat /etc/nginx/sites-available/sqtp 2>/dev/null | head -40; "
        "echo '--- DNS A from server ---'; getent hosts douyinhackathon.xinguangtreehole.com || true; "
        "echo '--- DNS A from server (8.8.8.8) ---'; dig +short douyinhackathon.xinguangtreehole.com @8.8.8.8 2>/dev/null || nslookup douyinhackathon.xinguangtreehole.com 8.8.8.8 2>/dev/null | tail -5",
        label="inspect existing nginx configs",
    )


@register("probe")
def _probe(client: paramiko.SSHClient) -> None:
    run(
        client,
        "echo '--- nginx sites ---'; ls /etc/nginx/sites-enabled/ 2>/dev/null; "
        "echo '--- existing certs ---'; ls /etc/letsencrypt/live/ 2>/dev/null || echo none; "
        "echo '--- listening 80/443/8000 ---'; ss -tlnp 2>/dev/null | grep -E ':(80|443|8000)\\b' || true; "
        "echo '--- /opt ---'; ls -la /opt/ 2>/dev/null; "
        "echo '--- python3 ---'; python3 --version; "
        "echo '--- existing services ---'; systemctl list-units --type=service --no-pager | grep -iE 'sqtp|douyin|nginx|gunicorn|uvicorn' || true; "
        "echo '--- disk ---'; df -h / 2>/dev/null | tail -2",
        label="probe",
    )


if __name__ == "__main__":
    main()
