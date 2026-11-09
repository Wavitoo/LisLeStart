import type { BracketStage } from "@lislestart/shared";
import { Heading, type HeadingLevel } from "@/components/ui/heading";
import { isEliminationFormat } from "@/lib/tournament/format";
import { Bracket } from "./bracket";
import { BracketTable } from "./bracket-table";
import { BracketViews } from "./bracket-views";
import { EmptyState, SectionError, TournamentSection, type SectionData } from "./section";

/** Les étapes en arbre ; plusieurs étapes à élimination ont chacune leur titre de niveau 3. */
function Stages({
  stages,
  render,
}: {
  stages: BracketStage[];
  render: (stage: BracketStage, level: HeadingLevel) => React.ReactNode;
}) {
  if (stages.length === 1 && stages[0]) return <>{render(stages[0], 3)}</>;
  return (
    <div className="flex flex-col gap-8">
      {stages.map((stage) => (
        <div key={stage.id} className="flex flex-col gap-4">
          <Heading level={3} className="type-heading text-fg">
            {stage.name}
          </Heading>
          {render(stage, 4)}
        </div>
      ))}
    </div>
  );
}

export function BracketSection({ result }: { result: SectionData<BracketStage[]> }) {
  let content: React.ReactNode;
  if (!result.ok) {
    content = <SectionError what="l'arbre" />;
  } else {
    const elimination = result.data.filter((stage) => isEliminationFormat(stage.format));
    if (elimination.length === 0) {
      content = (
        <EmptyState>
          {result.data.length > 0 ? (
            <>
              Ce tournoi se joue sans arbre à élimination : les résultats sont dans le{" "}
              <a href="#classement" className="text-lime-text underline underline-offset-2">
                classement
              </a>
              .
            </>
          ) : (
            "L'arbre sera publié à la clôture des inscriptions."
          )}
        </EmptyState>
      );
    } else {
      content = (
        <BracketViews
          tree={
            <Stages
              stages={elimination}
              render={(stage, level) => <Bracket stage={stage} level={level} />}
            />
          }
          list={
            <Stages
              stages={elimination}
              render={(stage, level) => <BracketTable stage={stage} level={level} />}
            />
          }
        />
      );
    }
  }

  return (
    <TournamentSection id="arbre" title="Arbre">
      {content}
    </TournamentSection>
  );
}
