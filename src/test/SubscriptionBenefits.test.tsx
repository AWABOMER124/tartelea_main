import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SubscriptionBenefitsList } from "@/components/subscription/SubscriptionBenefits";

describe("SubscriptionBenefitsList", () => {
  it("renders all benefits", () => {
    render(<SubscriptionBenefitsList />);
    expect(screen.getByText(/خصم.*على جميع الدورات/)).toBeInTheDocument();
    expect(screen.getByText(/الوصول الكامل لشات بوت التدبر/)).toBeInTheDocument();
  });

  it("renders with check icons when showCheck is true", () => {
    const { container } = render(<SubscriptionBenefitsList showCheck />);
    const icons = container.querySelectorAll(".text-emerald-500");
    expect(icons.length).toBe(5);
  });
});
