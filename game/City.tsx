import React, { useMemo } from 'react';
import { Prop } from './Prop';
import { PropType, PropConfig } from '../types';

export const City: React.FC = () => {
  const props = useMemo(() => {
    const items: PropConfig[] = [];
    const gridSize = 200;
    const blockSize = 20;
    const roadWidth = 8;
    
    let idCounter = 0;

    // Generate Blocks
    for (let x = -gridSize / 2; x < gridSize / 2; x += blockSize + roadWidth) {
      for (let z = -gridSize / 2; z < gridSize / 2; z += blockSize + roadWidth) {
        
        // 50% chance of a building block
        if (Math.random() > 0.1) {
          // Add a building
          const isTall = Math.random() > 0.7;
          items.push({
            id: `b-${idCounter++}`,
            type: PropType.BUILDING,
            position: [x + blockSize/2, isTall ? 4 : 2, z + blockSize/2],
            size: isTall ? 3 : 2.5,
            value: isTall ? 50 : 20,
            color: isTall ? '#89a' : '#abc'
          });

          // Props around the building
          for(let i=0; i<3; i++) {
             items.push({
                id: `p-${idCounter++}`,
                type: Math.random() > 0.5 ? PropType.CRATE : PropType.BARREL,
                position: [x + Math.random() * blockSize, 0.5, z + Math.random() * blockSize],
                size: 0.5,
                value: 2,
                color: Math.random() > 0.5 ? '#dcb' : '#a87'
             });
          }
        } else {
           // Park area
           for(let i=0; i<5; i++) {
             items.push({
                id: `t-${idCounter++}`,
                type: PropType.TREE,
                position: [x + Math.random() * blockSize, 1, z + Math.random() * blockSize],
                size: 0.8 + Math.random() * 0.5,
                value: 5,
                color: '#2d4'
             });
           }
        }
      }
    }

    // Generate Cars on roads
    for (let i = 0; i < 40; i++) {
       const isHorizontal = Math.random() > 0.5;
       const lane = (Math.floor(Math.random() * 10) - 5) * (blockSize + roadWidth);
       const pos = (Math.random() * gridSize) - gridSize/2;
       
       items.push({
          id: `c-${idCounter++}`,
          type: PropType.CAR,
          position: isHorizontal ? [pos, 1, lane] : [lane, 1, pos],
          size: 1,
          value: 10,
          color: ['#f00', '#00f', '#fff', '#222'][Math.floor(Math.random() * 4)]
       });
    }

    // Scatter small debris
    for(let i=0; i<100; i++) {
        items.push({
            id: `d-${idCounter++}`,
            type: PropType.CRATE,
            position: [(Math.random() - 0.5) * 180, 0.5, (Math.random() - 0.5) * 180],
            size: 0.4,
            value: 1,
            color: '#eda'
        });
    }

    return items;
  }, []);

  return (
    <>
      {props.map(prop => (
        <Prop key={prop.id} {...prop} />
      ))}
    </>
  );
};