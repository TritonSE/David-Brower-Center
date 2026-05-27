"use client";

import styles from "./AddNpoPopup.module.css";

import type { AddNpoStep } from "./addNpoShared";

type AddNpoProgressProps = {
  currentStep: AddNpoStep;
};

const STEPS: Array<{ key: AddNpoStep; label: string; number: number }> = [
  { key: "profile", label: "NPO Profile", number: 1 },
  { key: "relationships", label: "Relationships", number: 2 },
  { key: "review", label: "Review", number: 3 },
];

function stepIndex(step: AddNpoStep): number {
  return STEPS.findIndex((entry) => entry.key === step);
}

export default function AddNpoProgress({ currentStep }: AddNpoProgressProps) {
  const activeIndex = stepIndex(currentStep);

  return (
    <nav className={styles.stepper} aria-label="Add NPO progress">
      {STEPS.map((step, index) => {
        const isComplete = index < activeIndex;
        const isActive = index === activeIndex;
        const isLast = index === STEPS.length - 1;
        const showActiveTeal = isActive && currentStep !== "review";

        return (
          <div key={step.key} className={styles.stepItem}>
            <span
              className={`${styles.stepCircle} ${
                isComplete
                  ? styles.stepCircleComplete
                  : showActiveTeal
                    ? styles.stepCircleActive
                    : ""
              }`}
              aria-current={isActive ? "step" : undefined}
            >
              {isComplete ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path
                    d="M2.5 7L5.5 10L11.5 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                step.number
              )}
            </span>
            <span
              className={`${styles.stepLabel} ${
                isComplete || showActiveTeal ? styles.stepLabelComplete : ""
              }`}
            >
              {step.label}
            </span>
            {!isLast ? <span className={styles.stepConnector} aria-hidden="true" /> : null}
          </div>
        );
      })}
    </nav>
  );
}
