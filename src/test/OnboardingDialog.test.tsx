import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import OnboardingDialog from "@/components/onboarding/OnboardingDialog";

describe("OnboardingDialog", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows onboarding for first-time users", () => {
    render(<OnboardingDialog />);
    // Use getAllByText since DialogTitle renders both sr-only and visible h2
    const elements = screen.getAllByText("المكتبة الشاملة");
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it("does not show if already completed", () => {
    localStorage.setItem("onboarding_completed", "true");
    render(<OnboardingDialog />);
    expect(screen.queryByText("المكتبة الشاملة")).not.toBeInTheDocument();
  });

  it("navigates through steps", () => {
    render(<OnboardingDialog />);
    fireEvent.click(screen.getByText("التالي"));
    const elements = screen.getAllByText("الدورات التدريبية");
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it("completes onboarding on last step", () => {
    render(<OnboardingDialog />);
    fireEvent.click(screen.getByText("التالي"));
    fireEvent.click(screen.getByText("التالي"));
    fireEvent.click(screen.getByText("التالي"));
    fireEvent.click(screen.getByText("ابدأ الآن!"));
    expect(localStorage.getItem("onboarding_completed")).toBe("true");
  });
});
