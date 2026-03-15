"use client";

import { getPartyColour, type EnrichedWardFeature } from "@/lib/ward-utils";

interface Props {
  data: EnrichedWardFeature;
  onClose: () => void;
}

export default function WardPanel({ data, onClose }: Props) {
  const { wardName, ward, currentParty, currentCouncillors, allCandidates } = data;

  const declared2026 = allCandidates.filter(
    (c) =>
      !c.status.toLowerCase().includes("current councillor") &&
      !c.status.toLowerCase().includes("incumbent")
  );

  return (
    <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto shrink-0">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-semibold text-gray-900">{wardName}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            aria-label="Close panel"
          >
            &times;
          </button>
        </div>

        {/* Current party badge */}
        {currentParty && (
          <span
            className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium text-white"
            style={{ backgroundColor: getPartyColour(currentParty) }}
          >
            {currentParty}
          </span>
        )}

        {/* Ward metadata */}
        {ward && (
          <div className="mt-3 space-y-1 text-sm text-gray-600">
            {ward.priority && (
              <p>
                Priority:{" "}
                <span className="font-medium text-gray-800">
                  {ward.priority}
                </span>
              </p>
            )}
            {ward.competitiveness && (
              <p>
                Competitiveness:{" "}
                <span className="font-medium text-gray-800">
                  {ward.competitiveness}
                </span>
              </p>
            )}
            {ward.margin2022 !== null && (
              <p>
                2022 margin:{" "}
                <span className="font-medium text-gray-800">
                  {ward.margin2022}%
                </span>
              </p>
            )}
            {ward.cyclingIssues.length > 0 && (
              <div>
                <p className="font-medium text-gray-800 mt-2">
                  Cycling issues
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {ward.cyclingIssues.map((issue) => (
                    <span
                      key={issue}
                      className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600"
                    >
                      {issue}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {ward.notes && (
              <p className="mt-2 text-xs text-gray-500 italic">{ward.notes}</p>
            )}
          </div>
        )}

        {/* Current Councillors */}
        {currentCouncillors.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Current Councillors
            </h3>
            <div className="space-y-2">
              {currentCouncillors.map((c) => (
                <CandidateCard key={c.name} candidate={c} />
              ))}
            </div>
          </div>
        )}

        {/* 2026 Candidates */}
        {declared2026.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              2026 Candidates
            </h3>
            <div className="space-y-2">
              {declared2026.map((c) => (
                <CandidateCard key={c.name} candidate={c} />
              ))}
            </div>
          </div>
        )}

        {allCandidates.length === 0 && (
          <p className="mt-4 text-sm text-gray-400 italic">
            No candidate data yet
          </p>
        )}
      </div>
    </div>
  );
}

function CandidateCard({
  candidate,
}: {
  candidate: {
    name: string;
    party: string;
    status: string;
    engagementLevel: string;
    positionOnCycling: string;
  };
}) {
  const partyColour = getPartyColour(candidate.party);

  return (
    <div className="rounded border border-gray-100 p-2 text-sm">
      <div className="flex items-center gap-2">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: partyColour }}
        />
        <span className="font-medium text-gray-800">{candidate.name}</span>
      </div>
      <div className="ml-4.5 mt-0.5 text-xs text-gray-500 space-y-0.5">
        <p>{candidate.party}{candidate.status ? ` \u00B7 ${candidate.status}` : ""}</p>
        {candidate.engagementLevel && (
          <p>Engagement: {candidate.engagementLevel}</p>
        )}
        {candidate.positionOnCycling && (
          <p>Cycling position: {candidate.positionOnCycling}</p>
        )}
      </div>
    </div>
  );
}
