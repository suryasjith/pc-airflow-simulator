# AeroFlow - PC Case Airflow Simulator & Pressure Optimizer

[![Live Web App](https://img.shields.io/badge/Live%20Demo-Online-success?style=for-the-badge&logo=google-chrome&logoColor=white)](https://suryasjith.github.io/pc-airflow-simulator/)
[![Build Status](https://img.shields.io/badge/Tests-31%20Passed-brightgreen?style=for-the-badge)](https://suryasjith.github.io/pc-airflow-simulator/)

🌐 **Live Web Application:** [https://suryasjith.github.io/pc-airflow-simulator/](https://suryasjith.github.io/pc-airflow-simulator/)

A modern, minimalist dark-mode React application engineered to simulate desktop PC chassis aerodynamics, compute internal static air pressure differential ($\Delta CFM$), and diagnose critical thermal and airflow conflicts in real time using the **comprehensive real-world PC component database from `docyx/pc-part-dataset`**.

---

## 🌟 Key Features

### 1. Fresh State UI & Paced Beginner Workflow
- **Blank Slate Launch:** Starts completely empty with no pre-selected configurations or auto-filled data.
- **Paced Progressive Stepper:**
  - **Step 1: Case & Hardware:** Search & select from 18,800+ real-world market parts.
  - **Step 2: Mounts & Flow Direction:** Configure fans, speeds, AIO radiators, and intake/exhaust directions.
  - **Step 3: Visual Simulation:** View dynamic canvas streamlines, thermal gradients, and interactive mount toggles.
  - **Step 4: Physics & Diagnostics:** Review pressure gauges, $\Delta CFM$, air turnover, and conflict warnings.
- **Pro View Mode:** One-click toggle to an expansive all-in-one matrix view for enthusiast builders.
- **Reset to Blank Slate:** Instant wipe back to zero at any point.

### 2. Comprehensive Real-World Component Database (18,800+ Parts)
Fetched directly from [`docyx/pc-part-dataset`](https://github.com/docyx/pc-part-dataset) on GitHub via our parsing utility script:
- **6,626 PC Cases (`cases.json`):** Form factors (ATX, Micro-ATX, Mini-ITX, E-ATX), external volume in Liters, front panel flow type (Mesh, Perforated, Glass), and physical mount capacities.
- **2,851 CPU Coolers (`cpu-coolers.json`):** Liquid AIOs (120mm, 240mm, 280mm, 360mm, 420mm) and dual/single-tower air coolers with calibrated fan CFM and TDP ratings.
- **6,636 Graphics Cards (`video-cards.json`):** Real-world GPUs across NVIDIA (RTX 5090, 5080, 4090, 4080, 4070, 3060), AMD Radeon (RX 7900 XTX, 7900 XT, 7800 XT, 6600), and Intel Arc with calibrated TDP power draw, card lengths, and cooling styles (Open-Air Triple, Open-Air Dual, Blower, Hybrid AIO).
- **2,744 Case Fans (`case-fans.json`):** 120mm & 140mm industry standard models with calibrated CFM ratings, static pressure ($mm\ H_2O$), noise levels ($dBA$), and max RPM.
- **Searchable Combobox Component (`SearchablePartPicker`):** Sub-millisecond instant search across 6,000+ items with category filtering (e.g. Mesh Front, Glass Panel, Liquid AIO, Air Tower, RTX 40/50, High CFM).

### 3. Granular Fan Slots, Side Mounts & Advanced Per-Slot Controls
- **5-Panel Architecture:** Explicit support for **Front, Top, Rear, Bottom, and Side** mounts (including dual-chamber chassis like Lian Li O11 Dynamic, NZXT H9, Phanteks NV7).
- **Discrete Individual Slots:** Dynamically generates individual, discrete fan slots (e.g. three separate 120mm slots on a side panel) rather than grouped panel controls.
- **Independent Per-Slot Controls:**
  - Independent **Intake** vs. **Exhaust** directional toggle per slot.
  - Granular **PWM slider** ($0\%\text{--}100\%$) for fine-tuned fan speed curves.
  - Live per-slot CFM readout dynamically calculated from maximum fan CFM rating and PWM percentage.
  - Per-slot AIO radiator attachment toggle.

### 4. Aerodynamic & Thermodynamic Physics Engine with Static Pressure
- **Live Fan Slot CFM Formula:**
  $$\text{Live Slot CFM} = \text{maxCFM} \times \left(\frac{\text{PWM \%}}{100}\right) \times (1 - 0.40 \text{ if radiator mounted})$$
  - **Static Pressure Impedance:** Automatically penalizes fan airflow by $-40\%$ when mounted against an AIO radiator, matching real-world bench measurements for dense cooling fins ($18\text{--}22\text{ FPI}$).
  - Additional panel flow restriction modeling: Mesh vs. Perforated vs. Solid Glass side venting.
- **Pressure Differential ($\Delta CFM$):**
  $$\Delta CFM = \sum CFM_{\text{intake}} - \sum CFM_{\text{exhaust}}$$
  - **Optimal Positive Equilibrium ($1.05\text{--}1.65\times$):** The gold standard for PC building. Maintains positive cabin pressure to repel dust through unsealed chassis seams while exhausting heat efficiently.
  - **Strong Positive ($> 1.65\times$):** High dust rejection; prompts check for adequate exhaust velocity.
  - **Neutral ($0.95\text{--}1.05\times$):** Equal intake and exhaust balance.
  - **Slight Negative ($0.75\text{--}0.95\times$):** Minor dust ingress.
  - **Extreme Negative Pressure / Critical Vacuum ($< 0.75\times$ or $\Delta CFM < -35$):** Heavy negative pressure that draws unfiltered ambient dust through seams and starved heatsinks.
- **Air Turnover Rate:** Case volume refresh cycle frequency (e.g. $40\times\text{--}120\times$ per minute).
- **Estimated Component $\Delta T$:** Real-time thermal rise above room ambient for both CPU and GPU based on active CFM and thermal dissipation (TDP).

### 5. Smart Diagnostic & Conflict Auditor HUD
- **Short-Looping Detection:** Instantly detects and warns if adjacent fan slots on the exact same panel (e.g., Top 1 Intake and Top 2 Exhaust) oppose each other, preventing internal recirculation loops.
- **GPU Starvation Warning:** Alerts when a Front or Side mount holding an AIO radiator is set to Intake, pre-heating incoming air up to $\sim 45^\circ\text{C}$ before it reaches an open-air GPU.
- **Extreme Negative Pressure Alert:** Fires whenever total exhaust drastically outpaces intake, flagging severe dust ingress risks.
- **All-Exhaust / All-Intake Warnings:** Flags missing intake corridors or trapped internal thermal pockets.
- **Interactive 1-Click Quick-Fix Buttons:** Automated resolutions (e.g., "Synchronize Panel Direction", "Move Radiator to Top Exhaust", "Adjust Intake PWM").

### 6. Interactive Visualizer & Airflow Simulation
- **Chassis Cross-Section Diagram:**
  - Interactive mounts for **Front, Side, Top, Rear, and Bottom**.
  - Direct 1-click toggles right on the visualizer for **Intake** (Cold Blue/Cyan arrows $\rightarrow / \downarrow$) vs **Exhaust** (Hot Red/Amber arrows $\leftarrow / \uparrow$).
  - Animated fan blades, motherboard VRM, CPU socket / cooler, GPU backplate and axial fans, and PSU tunnel.
- **Dynamic HTML5 Canvas Particle Kinematics (60 FPS):**
  - Cool cyan particles emit from active intake mounts proportional to fan PWM.
  - Particles drift across components; as they pass heatsinks, they absorb heat and transition from cyan $\rightarrow$ amber $\rightarrow$ crimson.
  - Exhaust fans pull air outwards into focused exhaust cones.
  - **Dust Ingress Simulation:** Under strong negative pressure, gray dust specks seep inward through unsealed rear PCIe slots and case joints.
  - **Short-Looping / Turbulence Vortex Simulation:** Opposing fans or clashing streams generate dynamic swirling eddy vortices.

---

## 🚀 Getting Started

### Prerequisites
- Node.js $\ge 18$ (Tested on Node v22)
- npm $\ge 9$

### Installation & Run
```bash
# 1. Install dependencies
npm install

# 2. Fetch the latest market datasets (optional, already pre-fetched)
npm run fetch:data

# 3. Start the development server
npm run dev

# 4. Open in browser
# http://127.0.0.1:3000
```

### Run Tests
```bash
# Verify state logic & physics calculations
npx --yes tsx test/verifyStateLogic.ts

# Verify comprehensive real-world dataset & search indexing
npx --yes tsx test/verifyComprehensiveDataset.ts
```
