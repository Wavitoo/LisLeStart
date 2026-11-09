import type { StageStandings, StandingsGroup } from "@lislestart/shared";
import { Heading, type HeadingLevel } from "@/components/ui/heading";
import { cx } from "@/lib/cx";
import {
  EmptyState,
  ScrollRegion,
  SectionError,
  TournamentSection,
  type SectionData,
} from "./section";

// Lignes classées de « Top pronostiqueurs » (maquette 4:134) : rang en lime, nom, valeurs en mono.
const th = "px-3 py-2 text-left type-overline text-fg-muted";
const td = "border-t border-line px-3 py-2.5";

/** En-tête court à l'écran (« V »), complet pour les lecteurs d'écran (« Victoires »). */
function Abbr({ short, full }: { short: string; full: string }) {
  return (
    <>
      <span aria-hidden="true">{short}</span>
      <span className="sr-only">{full}</span>
    </>
  );
}

function GroupTable({
  group,
  caption,
  hideCaption,
}: {
  group: StandingsGroup;
  caption: string;
  /** Le titre de la poule est déjà affiché juste au-dessus. */
  hideCaption: boolean;
}) {
  const draws = group.rows.some((row) => row.draws !== null);
  const points = group.rows.some((row) => row.points !== null);
  return (
    <table className="w-full min-w-xs border-collapse">
      <caption className={hideCaption ? "sr-only" : "pb-2 text-left type-overline text-fg-muted"}>
        {caption}
      </caption>
      <thead>
        <tr>
          <th scope="col" className={th}>
            Rang
          </th>
          <th scope="col" className={th}>
            Participant
          </th>
          <th scope="col" className={cx(th, "text-right")}>
            <Abbr short="V" full="Victoires" />
          </th>
          {draws && (
            <th scope="col" className={cx(th, "text-right")}>
              <Abbr short="N" full="Nuls" />
            </th>
          )}
          <th scope="col" className={cx(th, "text-right")}>
            <Abbr short="D" full="Défaites" />
          </th>
          {points && (
            <th scope="col" className={cx(th, "text-right")}>
              <Abbr short="Pts" full="Points" />
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {group.rows.map((row) => (
          <tr key={row.participantId}>
            <td className={cx(td, "w-14 type-mono-s font-bold text-lime")}>
              <span aria-hidden="true">#</span>
              {row.rank}
            </td>
            <th scope="row" className={cx(td, "text-left type-body-m-strong text-fg")}>
              {row.name}
            </th>
            <td className={cx(td, "text-right type-mono-s text-fg")}>{row.wins}</td>
            {draws && (
              <td className={cx(td, "text-right type-mono-s text-fg")}>{row.draws ?? "—"}</td>
            )}
            <td className={cx(td, "text-right type-mono-s text-fg")}>{row.losses}</td>
            {points && (
              <td className={cx(td, "text-right type-mono-s font-bold text-fg")}>
                {row.points ?? "—"}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Une étape : titre de niveau 3, puis un tableau par poule (titre de niveau 4) quand l'étape
 * en a plusieurs.
 */
function Stage({ stage, level }: { stage: StageStandings; level: HeadingLevel }) {
  const multiple = stage.groups.length > 1;
  return (
    <div className="flex flex-col gap-4">
      <Heading level={level} className="type-heading text-fg">
        {stage.stageName}
      </Heading>
      <div className={cx("grid gap-6", multiple && "lg:grid-cols-2")}>
        {stage.groups.map((group) => {
          const name = group.name ?? stage.stageName;
          return (
            <div key={group.id} className="flex min-w-0 flex-col gap-2">
              {multiple && (
                <Heading
                  level={(level + 1) as HeadingLevel}
                  className="type-body-m-strong text-fg-secondary"
                >
                  {name}
                </Heading>
              )}
              <ScrollRegion label={`Classement ${name}, défilement horizontal`}>
                <GroupTable group={group} caption={`Classement ${name}`} hideCaption={multiple} />
              </ScrollRegion>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function StandingsSection({ result }: { result: SectionData<StageStandings[]> }) {
  let content: React.ReactNode;
  if (!result.ok) {
    content = <SectionError what="le classement" />;
  } else {
    const stages = result.data.filter((stage) =>
      stage.groups.some((group) => group.rows.length > 0),
    );
    content =
      stages.length === 0 ? (
        <EmptyState>Le classement apparaîtra après les premiers résultats.</EmptyState>
      ) : (
        <div className="flex flex-col gap-8">
          {stages.map((stage) => (
            <Stage key={stage.stageId} stage={stage} level={3} />
          ))}
        </div>
      );
  }

  return (
    <TournamentSection id="classement" title="Classement">
      {content}
    </TournamentSection>
  );
}
