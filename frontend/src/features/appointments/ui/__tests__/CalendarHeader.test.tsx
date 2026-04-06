import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/__tests__/test-utils";
import { CalendarHeader } from "../CalendarHeader";

describe("CalendarHeader", () => {
  const defaultProps = {
    currentDate: new Date("2026-03-28T12:00:00"),
    view: "week" as const,
    onViewChange: vi.fn(),
    onNavigate: vi.fn(),
  };

  it("expone estado seleccionado con aria-pressed", () => {
    render(<CalendarHeader {...defaultProps} />);

    expect(screen.getByRole("button", { name: "Semana" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Día" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("permite cambiar de vista", async () => {
    const user = userEvent.setup();
    const onViewChange = vi.fn();

    render(<CalendarHeader {...defaultProps} onViewChange={onViewChange} />);

    await user.click(screen.getByRole("button", { name: "Mes" }));
    expect(onViewChange).toHaveBeenCalledWith("month");
  });
});
