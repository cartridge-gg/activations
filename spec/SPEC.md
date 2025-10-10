# The Rōnin’s Pact — Serverless Quest Feature Spec

> **Scope:** Static frontend + Starknet contracts only. No servers, no indexers, no bots. Twitter/X and Discord role assignment are out of scope for v1.

---

## 1) Goals

* Drive pre-jam engagement through a single, evolving participation NFT (“The Rōnin’s Pact”).
* Let participants complete three thematic trials (Technique, Wisdom, Spirit) with **self-serve, automatic verification**.
* Keep the system **fully serverless** while providing a smooth, low-friction UX for new and existing Starknet users.

---

## 2) User Experience

* Users connect with **Cartridge Controller**.
* Users mint **one** Rōnin’s Pact NFT to their wallet.
* A **Quest Dashboard** shows three trials with real-time status (Locked / In Progress / Completed).
* As each trial is completed, the NFT artwork updates to light one of three slashes.
* When all trials are complete, the NFT displays the **“Fully Forged Pact”** state.
* The UI includes a **“Share on X”** button (optional amplification; not verified).

---

## 3) Core Features

### 3.1 Authentication & Account

* Connect/disconnect via **Cartridge Controller**.
* Display the currently connected wallet address.
* Show signer selection UI for Trial 3 (see §3.4).

### 3.2 The Rōnin’s Pact (Dynamic NFT)

* **One-per-wallet** mint policy.
* NFT artwork has **four visual states**:

  * Base (0 slashes lit)
  * +Waza lit (1/3)
  * +Chi lit (2/3)
  * +Shin lit (3/3 “Fully Forged Pact”)
* NFT metadata displays **progress traits** (Waza/Chi/Shin: Complete/Incomplete).
* Artwork updates **automatically** when progress changes (no manual refresh).

### 3.3 Trial 1 — **Waza** (Technique)

* **Objective:** Prove play in a supported Dojo-powered game.
* **Serverless verification rule (v1):** A wallet **owns ≥1 token** from **any allowlisted “round” ERC-721 collection** (e.g., Pistols, Loot Survivor, Blob Arena).
* **UI:**

  * “Claim via \[Game]” buttons (one per allowlisted collection).
  * “Try All” button that checks all allowlisted collections at once.
* **Acceptance Criteria:**

  * If the wallet holds a token from an allowlisted collection, claiming **succeeds** and Waza is marked **Complete**.
  * If not, claiming **fails** with a clear, user-readable reason.
  * Re-claim after completion is blocked with a clear status (“Already complete”).

> Note: Time windows, non-transferability, and per-game session checks are **not required** in v1.

### 3.4 Trial 2 — **Chi** (Wisdom)

* **Objective:** Demonstrate knowledge about Dojo 1.7 via a short quiz.
* **Behavior:**

  * The quiz is answered **in-app** and the result is **recorded onchain**.
  * Passing the quiz marks **Chi** as **Complete**.
* **UI:**

  * Inline questions with validation and a single “Submit” action.
  * Clear success/failure feedback; allow retakes if desired (product choice).
* **Acceptance Criteria:**

  * Correct answers result in a single successful onchain submission and Chi becomes **Complete**.
  * Incorrect answers provide immediate feedback and do **not** complete the trial.

### 3.5 Trial 3 — **Shin** (Spirit)

* **Objective:** Make a public-spirited vow tied to a specific wallet signer GUID.
* **Behavior (v1):**

  * The user **chooses a signer GUID** through Controller (Discord or any other signer type is acceptable).
  * The user **signs a vow message** with that GUID and confirms onchain.
  * Successful confirmation marks **Shin** as **Complete** and emits a public record of the vow text.
* **UI:**

  * Text input for the vow message.
  * “Choose signer” interaction via Controller.
  * “Complete Vow” confirmation with success/failure feedback.
* **Acceptance Criteria:**

  * The claimed GUID corresponds to a signer the account recognizes.
  * A valid signature tied to that GUID is provided; otherwise, the action is rejected.
  * Nonces prevent replay; reused nonces are rejected with clear feedback.

> Note: Enforcing “Discord-only” is **not required** in v1; any signer GUID is acceptable.

---

## 4) Quest Dashboard & States

* **Global Progress:** Show total completed trials (0/3 → 3/3).
* **Per-Trial Cards:** Each card displays:

  * Trial name, lore subtitle, and iconography.
  * Current state (Locked / In Progress / Completed).
  * Relevant action buttons:

    * Waza: “Claim via \[Game]”, “Try All”.
    * Chi: “Take Quiz / Submit”.
    * Shin: “Write Vow / Choose Signer / Complete Vow”.
* **NFT Preview:** Live render of the Pact artwork that reflects current progress.

---

## 5) Social Amplification (Optional)

* **Share on X** button:

  * Precomposed message with official hashtag and link.
  * Opens the user’s X client compose; **no** verification required.
* Encouraged in UI copy, but **not** required to complete any trial.

---

## 6) Administration & Configuration

* **Allowlisted collections** for Waza are configurable at deployment.
* **Quiz content** (questions and accepted answers) is configurable at deployment.
* **Quest timing** (start/end windows) can be defined as a product setting (optional for v1).

---

## 7) Error Handling & Edge Cases

* Clear, human-readable errors for:

  * Not connected / wrong network.
  * Attempting to mint more than one Pact.
  * Claiming Waza without owning an allowlisted token.
  * Incorrect quiz answers.
  * Missing or invalid signer GUID for Shin.
  * Signature failures and nonce reuse for Shin.
* UI disables or hides actions that are **already completed**.
* All states are **idempotent**: completing a trial twice does not duplicate effects.

---

## 8) Accessibility & Usability

* Keyboard-navigable UI; readable contrast.
* Inline help/tooltips for trial requirements.
* Progress is legible at a glance (badges, ticks, or color states).

---

## 9) Non-Goals (v1)

* No Twitter/X verification of posts.
* No Discord role assignment or bots.
* No offchain indexers or servers.
* No anti-farm controls for transferable round NFTs beyond the simple ownership rule.

---

## 10) Success Criteria

* Users can:

  * Connect with Controller.
  * Mint exactly one Pact.
  * Complete each trial with clear, self-serve flows.
  * See their NFT artwork update as trials are completed.
* “Fully Forged Pact” state is attainable without manual admin intervention.
* All interactions remain serverless and function with only a static frontend plus contracts.
