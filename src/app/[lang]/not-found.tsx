import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

/** Shown inside the page layout. Keeps to English because a 404 cannot read the route's language. */
export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-bold">We could not find that page.</h1>
      <p className="mt-3 text-lg">The link may be old. You can start again from the home page.</p>
      <Link href="/" className={`${buttonVariants()} mt-5`}>
        Go to the home page
      </Link>
    </div>
  );
}
