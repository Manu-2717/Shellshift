import { redirect } from "next/navigation";
export default function NewChallenge() {
  redirect(
    "/admin/challenges?notice=Challenges+are+created+in+the+source+catalog",
  );
}
