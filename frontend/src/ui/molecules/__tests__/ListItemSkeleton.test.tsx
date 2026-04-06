import { describe, it, expect } from "vitest";
import { render } from "@/__tests__/test-utils";
import { ListItemSkeleton } from "../ListItemSkeleton";

describe("ListItemSkeleton", () => {
  it("renderiza correctamente", () => {
    const { container } = render(<ListItemSkeleton />);
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThanOrEqual(2);
  });

  it("renderiza avatar y 2 lineas por defecto", () => {
    const { container } = render(<ListItemSkeleton lines={2} />);
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBe(3);
  });

  it("renderiza avatar y 1 linea cuando lines=1", () => {
    const { container } = render(<ListItemSkeleton lines={1} />);
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBe(2);
  });

  it("aplica avatarSize sm", () => {
    const { container } = render(<ListItemSkeleton avatarSize="sm" />);
    const skeleton = container.querySelector('[data-slot="skeleton"]');
    expect(skeleton).toHaveClass("h-9", "w-9");
  });

  it("aplica avatarSize md por defecto", () => {
    const { container } = render(<ListItemSkeleton />);
    const skeleton = container.querySelector('[data-slot="skeleton"]');
    expect(skeleton).toHaveClass("h-12", "w-12");
  });
});
