import React, { useEffect, useRef, useState } from 'react';
import { brush as d3Brush } from 'd3-brush';
import { select } from 'd3-selection';
import { useContext } from '../../hooks/useContext';

interface IBrushProps {
  onSelect: (values: any) => void;
}

const Brush: React.FunctionComponent<IBrushProps> = props => {
  const { onSelect } = props;
  const { store, updateStore } = useContext();
  const { graph } = store;

  const brushRef = useRef<SVGSVGElement>(null);
  const [isBrushActive, setIsBrushActive] = useState(false);
  const handleSelect = selectedNodes => {
    const nodeStatus = selectedNodes.reduce((acc, curr) => {
      return {
        ...acc,
        [curr.id]: {
          selected: true,
        },
      };
    }, {});
    updateStore(draft => {
      draft.nodeStatus = nodeStatus;
    });
    onSelect && onSelect(selectedNodes);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        console.log('Shift key pressed');
        setIsBrushActive(preState => {
          return !preState;
        });
      }
      if (event.key === 'Escape' || event.key === 'Enter') {
        setIsBrushActive(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const svg = select(brushRef.current);
    if (isBrushActive && graph) {
      const { nodes = [] } = graph.graphData() || {};
      const brush = d3Brush()
        .extent([
          [0, 0],
          //@ts-ignore
          [svg.node().clientWidth, svg.node().clientHeight],
        ])
        .on('end', event => {
          if (!event.selection) return;
          const [[x0, y0], [x1, y1]] = event.selection;

          const p0 = graph.screen2GraphCoords(x0, y0, 0);
          const p1 = graph.screen2GraphCoords(x1, y1, 0);

          const selectedNodes = nodes.filter(node => {
            //@ts-ignore
            return node.x >= p0.x && node.x <= p1.x && node.y >= p0.y && node.y <= p1.y;
          });
          handleSelect(selectedNodes);
        });

      svg.append('g').attr('class', 'brush').call(brush);
    }
    return () => {
      svg.select('.brush').remove();
    };
  }, [isBrushActive, onSelect, graph]);
  const style: React.CSSProperties = isBrushActive
    ? {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        background: 'rgba(0, 0, 0, 0.05)',
      }
    : {
        display: 'none',
      };
  return <svg ref={brushRef} style={style} />;
};

export default Brush;