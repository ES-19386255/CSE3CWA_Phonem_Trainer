import type { Metadata } from "next";
import Card from "@/components/Card";
import PageTitle from "@/components/PageTitle";

const NAME = "Erin Sproule";
const STUDENT_NUMBER = "19386255";
const VIDEO_URL = "";

export const metadata: Metadata = { title: "About" };

// The About page: explains the project scope and links to the walkthrough video.
export default function AboutPage() {
  return (
    <div className="pb-12">
      <PageTitle title="About" description="What Phoneme Builder is, and what it can do." />
      <div className="mx-auto max-w-3xl space-y-4 px-4">
        <Card>
          <h2 className="mb-2 text-lg font-semibold text-[var(--primary)]">What is Phoneme Builder?</h2>
          <p className="text-sm text-[var(--text-muted)]">
            Phoneme Builder is a classroom activity builder for Speech Pathology teachers. Instead of typing ordinary words, teachers build activities out of phonemes — the individual sounds in spoken English — which the app turns into a Wordle game or a Word Search puzzle.
          </p>
        </Card>

        <Card>
          <h2 className="mb-2 text-lg font-semibold text-[var(--primary)]">What can it do?</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--text-muted)]">
            <li>Build a Wordle or a Word Search from phonemes and download it as one file for students.</li>
            <li>Save activities and reusable word lists in a database, and manage them on the Manage page.</li>
            <li>Track health, usage, generation results and alerts on the Dashboard.</li>
          </ul>
        </Card>

        <Card>
          <h2 className="mb-2 text-lg font-semibold text-[var(--primary)]">About the dashboard data</h2>
          <p className="text-sm text-[var(--text-muted)]">
            Real use is recorded as it happens. So the dashboard has history to show, some generations, page views and daily snapshots are <strong>simulated</strong>. They are marked as simulated in the database and on the Dashboard.
          </p>
        </Card>

        <Card>
          <h2 className="mb-2 text-lg font-semibold text-[var(--primary)]">Walkthrough video</h2>
          {VIDEO_URL ? (
            <div className="aspect-video overflow-hidden rounded-md border border-[var(--border)]">
              <iframe src={VIDEO_URL} title="Walkthrough video" className="h-full w-full" allowFullScreen />
            </div>
          ) : (
            <p className="rounded-md border border-dashed border-[var(--border)] p-3 text-sm text-[var(--text-muted)]">
            </p>
          )}
        </Card>

        <Card>
          <p className="text-sm">Submitted by {NAME} · {STUDENT_NUMBER}</p>
        </Card>
      </div>
    </div>
  );
}
