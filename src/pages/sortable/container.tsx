import update from 'immutability-helper';
import { FC, useCallback, useState } from 'react';

export const ItemTypes = {
  CARD: 'card',
};

import { Card } from './card';
import { Row } from 'antd';

export interface Item {
  id: number;
  text: string;
}

export interface ContainerState {
  cards: Item[];
}

export const Container: FC = () => {
  {
    const [cards, setCards] = useState([
      {
        id: 1,
        text: 'Write111',
      },
      {
        id: 2,
        text: 'Make',
      },
      {
        id: 3,
        text: 'Write22',
      },
      {
        id: 4,
        text: 'Create',
      },
      {
        id: 5,
        text: 'Spam',
      },
      {
        id: 6,
        text: '???',
      },
      {
        id: 7,
        text: 'PROFIT',
      },
    ]);

    const moveCard = useCallback((dragIndex: number, hoverIndex: number) => {
      setCards((prevCards: Item[]) =>
        update(prevCards, {
          $splice: [
            [dragIndex, 1],
            [hoverIndex, 0, prevCards[dragIndex] as Item],
          ],
        })
      );
    }, []);

    const renderCard = useCallback((card: { id: number; text: string }, index: number) => {
      return <Card key={card.id} index={index} id={card.id} text={card.text} moveCard={moveCard} />;
    }, []);

    return (
      <>
        <Row>{cards.map((card, i) => renderCard(card, i))}</Row>
      </>
    );
  }
};
