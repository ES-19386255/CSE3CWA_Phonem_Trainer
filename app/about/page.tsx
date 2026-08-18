import Card from "@/components/Card";
import PageTitle from "@/components/PageTitle";

const NAME = "Erin Sproule";
const STUDENT_NUMBER = "19386255";

export default function AboutPage() {
  return (
    <div className="pb-12">
      <PageTitle title="About" description="What Phoneme Builder is and what this Assignment 1 covers" />
      <div className="mx-auto max-w-3xl space-y-4 px-4">
        <Card>
          <h2 className="mb-2 text-lg font-semibold text-[var(--primary)]">What is Phoneme Builder?</h2>
          <p className="text-sm text-[var(--text-muted)]">
            Phoneme Builder is a classroom activity builder for Speech Pathology teachers. Instead of typing ordinary words teachers build activities out
            of phonemes i.e. the individual sounds in spoken English, which the app turns into a Wordle game or a Word Search puzzle.
          </p>
        </Card>

        <Card>
          <h2 className="mb-2 text-lg font-semibold text-[var(--primary)]">What Assignment 1 covers</h2>
          <p className="text-sm text-[var(--text-muted)]">
            This is <strong>Assignment 1</strong>, constrained to frontend design and usability only for the moment. There is no database yet and both word lists are fixed rather than
            "teacher or institute managed". Subsiquent Assessment items will add a database-backed word list along with other additional functionality.
          </p>
        </Card>

        <Card>
          <p className="text-sm">Submitted by {NAME} - {STUDENT_NUMBER}</p>
        </Card>
      </div>
    </div>
  );
}
