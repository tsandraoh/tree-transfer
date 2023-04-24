import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Container } from './container';

export default () => (
  <DndProvider backend={HTML5Backend}>
    <Container />
  </DndProvider>
);
