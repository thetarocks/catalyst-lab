"""
Phase-Space Plotter for Sybil Reversal Thresholds
Author: Anonymous Submission (IRIS National Fair 2025-26)
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

DATA = [
    {"name": "Grants Milestone 1", "W": 4272.48, "G": 3992.73, "r": 0.9345, "k_star": 4},
    {"name": "ACryptoS LTIPP", "W": 4252.89, "G": 16856.83, "r": 3.9636, "k_star": 25},
    {"name": "Arbitrum Coalition", "W": 5192.48, "G": 73484.43, "r": 14.1521, "k_star": 230},
    {"name": "Security Enhancement", "W": 3834.53, "G": 110816.18, "r": 28.8995, "k_star": 894}
]

def render_plot(output_filename="empirical_reversal_thresholds_k_boundary_phase_space.png"):
    df = pd.DataFrame(DATA)
    fig, ax = plt.subplots(figsize=(10, 6.5), dpi=300)

    max_W = df['W'].max() * 1.3
    max_G = df['G'].max() * 1.15
    W_vals = np.linspace(0, max_W, 300)

    k_levels = [2, 5, 10, 25, 50, 100, 500, 1000]
    colors = plt.cm.viridis(np.linspace(0.1, 0.9, len(k_levels)))

    for k, col in zip(k_levels, colors):
        slope = np.sqrt(k) - 1.0
        G_vals = slope * W_vals
        ax.plot(W_vals, G_vals, label=f'$k = {k}$ (slope = {slope:.2f})', color=col, linestyle='--', linewidth=1.2)

    for _, row in df.iterrows():
        ax.scatter(row['W'], row['G'], color='#D62728', s=100, zorder=5, edgecolors='black', linewidth=1)
        ax.annotate(
            f"{row['name']}\n($r$ = {row['r']:.2f}, $k^*$ = {int(row['k_star'])})",
            (row['W'], row['G']),
            textcoords="offset points",
            xytext=(10, -5),
            fontsize=9,
            fontweight='bold'
        )

    ax.set_xlim(0, max_W)
    ax.set_ylim(0, max_G)
    ax.set_xlabel(r"Attacker Baseline Weight, $W=\sqrt{T_{\mathrm{attacker}}}$", fontsize=11)
    ax.set_ylabel(r"Absolute Sublinear Gap, $G = Q_{\mathrm{win}} - Q_{\mathrm{lose}}$", fontsize=11)
    ax.set_title("Empirical Reversal Thresholds in $k$-Boundary Phase Space", fontsize=13, pad=12)
    ax.legend(title="Reversal Threshold ($k$)", loc="upper left", frameon=True, fontsize=9)
    ax.grid(True, linestyle=':', alpha=0.6)

    plt.tight_layout()
    plt.savefig(output_filename)
    print(f"[✓] Saved figure to {output_filename}")

if __name__ == "__main__":
    render_plot()
