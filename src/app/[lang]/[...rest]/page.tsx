import { notFound } from "next/navigation";

/** Any deeper unknown address gets the same styled not-found page as everything else. */
export default function CatchAll() {
  notFound();
}
