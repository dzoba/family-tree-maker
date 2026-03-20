import { memo } from 'react';
import {
  BaseEdge,
  getBezierPath,
  getStraightPath,
  EdgeLabelRenderer,
  type EdgeProps,
} from '@xyflow/react';

// Spouse edge styles by relationship type
const SPOUSE_STYLES: Record<string, { stroke: string; dash?: string; label?: string }> = {
  married:  { stroke: '#f87171' },
  divorced: { stroke: '#9ca3af', dash: '4 4', label: 'div.' },
  partner:  { stroke: '#f9a8d4', dash: '6 3' },
  engaged:  { stroke: '#fbbf24', dash: '8 4', label: 'eng.' },
};

// Parent edge styles by type
const PARENT_STYLES: Record<string, { stroke: string; dash?: string; label?: string }> = {
  biological: { stroke: '#A3BFA3' },
  adoptive:   { stroke: '#93c5fd', dash: '6 3', label: 'adpt.' },
  step:       { stroke: '#c4b5fd', dash: '4 4', label: 'step' },
  foster:     { stroke: '#fcd34d', dash: '4 4', label: 'fstr.' },
};

function RelationshipEdgeComponent(props: EdgeProps) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data } = props;
  const isSpouse = data?.type === 'spouse';
  const subtype = (data?.subtype as string) || (isSpouse ? 'married' : 'biological');

  const styles = isSpouse
    ? SPOUSE_STYLES[subtype] || SPOUSE_STYLES.married
    : PARENT_STYLES[subtype] || PARENT_STYLES.biological;

  const [path, labelX, labelY] = isSpouse
    ? getStraightPath({ sourceX, sourceY, targetX, targetY })
    : getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });

  return (
    <>
      <BaseEdge
        path={path}
        style={{
          stroke: styles.stroke,
          strokeWidth: isSpouse ? 1.5 : 2,
          strokeDasharray: styles.dash,
        }}
      />
      {styles.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'none',
            }}
            className="rounded bg-white px-1 text-[9px] font-medium text-bark-400 shadow-sm border border-bark-100"
          >
            {styles.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default memo(RelationshipEdgeComponent);
