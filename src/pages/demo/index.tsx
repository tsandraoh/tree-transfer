import { memo, FC } from 'react';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useDrag, DragSourceMonitor, useDrop, DropTargetMonitor, DndProvider } from 'react-dnd';
import { Colors } from './colors_';
import { SourceBox } from './sourceBox';
import { StatefulTargetBox as TargetBox } from './targetBox';

// export const Container: FC = memo(function Container() {
//   return (
//     <div style={{ overflow: 'hidden', clear: 'both', margin: '-.5rem' }}>
//       <div style={{ float: 'left' }}>
//         <SourceBox color={Colors.BLUE}>
//           <SourceBox color={Colors.YELLOW}>
//             <SourceBox color={Colors.YELLOW} />
//             <SourceBox color={Colors.BLUE} />
//           </SourceBox>
//           <SourceBox color={Colors.BLUE}>
//             <SourceBox color={Colors.YELLOW} />
//           </SourceBox>
//         </SourceBox>
//       </div>

//       <div style={{ float: 'left', marginLeft: '5rem', marginTop: '.5rem' }}>
//         <TargetBox />
//       </div>
//     </div>
//   );
// });

export default () => <DndProvider backend={HTML5Backend}>
  <div style={{ overflow: 'hidden', clear: 'both', margin: '-.5rem' }}>
    <div style={{ float: 'left' }}>
      <SourceBox color={Colors.BLUE}>
        <SourceBox color={Colors.YELLOW}>
          <SourceBox color={Colors.YELLOW} />
          <SourceBox color={Colors.BLUE} />
        </SourceBox>
        <SourceBox color={Colors.BLUE}>
          <SourceBox color={Colors.YELLOW} />
        </SourceBox>
      </SourceBox>
    </div>

    <div style={{ float: 'left', marginLeft: '5rem', marginTop: '.5rem' }}>
      <TargetBox />
    </div>
  </div>

</DndProvider>;
