import Link from "next/link";
import { ArrowLeft, ShoppingCart, Ticket, Users, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartSheet } from "@/components/cart-sheet";
import { useViewModeStore } from "@/store/useViewModeStore";
import { Toggle } from "@/components/ui/toggle";

interface EventHeaderProps {
  eventName: string;
  cartCount: number;
  cartSheetOpen: boolean;
  setCartSheetOpen: (open: boolean) => void;
}

function ViewModeToggle() {
  const { mode, toggleMode } = useViewModeStore();

  return (
    <div className="flex items-center gap-2 border rounded-md p-1">
      <Toggle
        pressed={mode === "user"}
        onPressedChange={() => mode === "team" && toggleMode()}
        aria-label="Toggle user mode"
        className={`flex items-center gap-1 ${
          mode === "user" ? "bg-primary text-primary-foreground" : ""
        }`}
      >
        <User className="h-4 w-4" />
        <span className="text-xs">User</span>
      </Toggle>
      <Toggle
        pressed={mode === "team"}
        onPressedChange={() => mode === "user" && toggleMode()}
        aria-label="Toggle team mode"
        className={`flex items-center gap-1 ${
          mode === "team" ? "bg-primary text-primary-foreground" : ""
        }`}
      >
        <Users className="h-4 w-4" />
        <span className="text-xs">Team</span>
      </Toggle>
    </div>
  );
}

export function EventHeader({
  eventName,
  cartCount,
  cartSheetOpen,
  setCartSheetOpen,
}: EventHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">{eventName}</h1>
      </div>
      <div className="flex items-center gap-2">
        <ViewModeToggle />
        <CartSheet open={cartSheetOpen} onOpenChange={setCartSheetOpen}>
          <Button
            variant="outline"
            size="icon"
            className="relative"
            onClick={() => setCartSheetOpen(true)}
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Button>
        </CartSheet>

        <Button variant="outline" asChild>
          <Link href="/cart">
            <ShoppingCart className="h-4 w-4 mr-2" />
            View Cart
          </Link>
        </Button>

        <Button variant="outline" asChild>
          <Link href="/my-tickets">
            <Ticket className="h-4 w-4 mr-2" />
            My Tickets
          </Link>
        </Button>
      </div>
    </div>
  );
}
