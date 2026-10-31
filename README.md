# AeroFlow - PC Case Airflow Simulator & Pressure Optimizer

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

### 3. Airflow Mapping & Interactive Simulation
- **Chassis Cross-Section Diagram:**
  - Interactive mounts for **Front, Top, Rear, Bottom**.
  - Direct 1-click toggles right on the visualizer for **Intake** (Cold Blue/Cyan arrows $\rightarrow / \downarrow$) vs **Exhaust** (Hot Red/Amber arrows $\leftarrow / \uparrow$).
  - Animated fan blades, motherboard VRM, CPU socket / cooler, GPU backplate and axial fans, and PSU tunnel.
- **Dynamic HTML5 Canvas Particle Kinematics:**
  - Cool cyan particles emit from active intake mounts based on fan RPM.
  - Particles drift across components; as they pass heatsinks, they absorb heat and transition from cyan $\rightarrow$ amber $\rightarrow$ crimson.
  - Exhaust fans pull air outwards into focused exhaust cones.
  - **Dust Ingress Simulation:** Under strong negative pressure, gray dust specks seep inward through unsealed rear PCIe slots and case joints.
  - **Turbulence Vortex Simulation:** If top intake fans clash with rear exhaust, particles swirl in an eddy vortex directly over the motherboard.

### 4. Aerodynamic & Thermodynamic Physics Engine
- **Effective CFM Formula:**
  $$\text{Effective CFM} = \sum (\text{Fan CFM} \times \text{Count} \times \frac{\text{RPM \%}}{100} \times \text{Restriction Multipliers})$$
  - Radiator Fin Impedance: $\sim 28\text{--}32\%$ flow reduction (mitigated by high fan static pressure).
  - Dust Filter Restriction: $\sim 14\%$ flow reduction.
  - Front Panel Impedance: Mesh ($5\%$ loss) vs Perforated ($12\%$ loss) vs Solid Glass side vents ($28\%$ loss).
- **Pressure Differential ($\Delta CFM$):**
  $$\Delta CFM = CFM_{\text{intake}} - CFM_{\text{exhaust}}$$
  - **Optimal Slight Positive ($1.05\text{--}1.50\times$):** The gold standard for PC building. Air gently vents through unsealed cracks, actively repelling dust while maintaining laminar through-flow.
  - **Strong Positive ($> 1.50\times$):** High dust rejection, potential heat pooling if exhaust velocity is insufficient.
  - **Neutral ($0.95\text{--}1.05\times$):** Equal intake and exhaust.
  - **Slight Negative ($0.75\text{--}0.95\times$):** Minor dust ingress.
  - **Strong Negative / Critical Vacuum ($< 0.75\times$):** Unsealed seams act like a vacuum cleaner, sucking ambient room dust directly onto circuit boards.
- **Air Turnover Rate:** Case volume refresh rate (e.g. $40\times\text{--}120\times$ per minute).
- **Estimated Component $\Delta T$:** Real-time thermal estimation above room ambient for both CPU and GPU.

### 5. Smart Diagnostic & Conflict Auditor
- **Front Radiator GPU Pre-Heat Conflict:** Alerts when a front intake AIO radiator dumps warm $\sim 45^\circ\text{C}$ CPU exhaust air straight into the intake of an open-air GPU heatsink.
- **All-Exhaust Case Starvation:** Warns of negative pressure vacuum and air starvation.
- **All-Intake Trapped Heat:** Warns of lack of directional exhaust corridors.
- **Top Intake Opposing Rear Exhaust:** Warns of airflow clashes fighting natural thermal convection.
- **High-TDP GPU Starvation:** Alerts when a $>280\text{W}$ GPU lacks direct bottom or front intake air.
- **Interactive 1-Click Quick-Fix Buttons:** Instant resolution (e.g., "Move Radiator to Top Exhaust", "Flip Front Fans to Intake", "Add Bottom Intake Fans for GPU", "Cap Fan Count").

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
