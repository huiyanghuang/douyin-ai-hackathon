import matplotlib.pyplot as plt

# 数据提取自实验报告 P1.pdf (Chapter 4.3 Experiment Data)
N = [100, 500, 1000, 2000, 4000, 6000, 8000, 10000]

# 二分查找 (迭代版) - 平均持续时间 (秒) [cite: 132]
bs_iterative = [7.2e-6, 3.5e-5, 6.9e-5, 1.2e-4, 3.0e-4, 4.8e-4, 6.0e-4, 7.2e-4]

# 二分查找 (递归版) - 平均持续时间 (秒) [cite: 133]
bs_recursive = [5.7e-6, 3.4e-5, 7.0e-5, 1.3e-4, 2.6e-4, 4.0e-4, 4.3e-4, 6.6e-4]

# 顺序查找 (迭代版) - 平均持续时间 (秒) [cite: 133]
ss_iterative = [6.6e-3, 2.3e-2, 8.0e-2, 0.035, 0.14, 0.22, 0.47, 0.78]

# 顺序查找 (递归版) - 平均持续时间 (秒) [cite: 133]
ss_recursive = [2.5e-4, 6.5e-3, 0.026, 0.095, 0.042, 0.098, 0.17, 0.27]

# --- 绘图 1: 线性坐标系 (重点展示性能差距) ---
plt.figure(figsize=(10, 6))
plt.plot(N, bs_iterative, label='Binary Search (Iterative)', marker='o')
plt.plot(N, bs_recursive, label='Binary Search (Recursive)', marker='x')
plt.plot(N, ss_iterative, label='Sequential Search (Iterative)', marker='s')
plt.plot(N, ss_recursive, label='Sequential Search (Recursive)', marker='^')

plt.title('Algorithm Performance Comparison (Linear Scale)')
plt.xlabel('Array Size (N)')
plt.ylabel('Average Duration (seconds)')
plt.legend()
plt.grid(True)
plt.tight_layout()
plt.savefig('performance_linear.png')

# --- 绘图 2: 对数坐标系 (展示微观性能趋势) ---
plt.figure(figsize=(10, 6))
plt.plot(N, bs_iterative, label='Binary Search (Iterative)', marker='o')
plt.plot(N, bs_recursive, label='Binary Search (Recursive)', marker='x')
plt.plot(N, ss_iterative, label='Sequential Search (Iterative)', marker='s')
plt.plot(N, ss_recursive, label='Sequential Search (Recursive)', marker='^')

plt.yscale('log') # 使用对数轴处理量级差异
plt.title('Algorithm Performance Comparison (Logarithmic Scale)')
plt.xlabel('Array Size (N)')
plt.ylabel('Average Duration (seconds, log scale)')
plt.legend()
plt.grid(True, which="both", ls="-", alpha=0.5)
plt.tight_layout()
plt.savefig('performance_log.png')

plt.show()