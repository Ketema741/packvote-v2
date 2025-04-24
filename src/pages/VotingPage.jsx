import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import '../styles/VotingPage.css';

const VotingPage = () => {
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState([
    {
      id: '1',
      name: 'Paris, France',
      image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34',
    },
    {
      id: '2',
      name: 'Tokyo, Japan',
      image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26',
    },
    {
      id: '3',
      name: 'New York, USA',
      image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9',
    },
  ]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(destinations);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setDestinations(items);
  };

  const handleSubmitVote = () => {
    // TODO: Implement API call to submit rankings
    console.log('Rankings submitted:', destinations);
  };

  return (
    <div className="voting-page">
      <div className="back-button" onClick={() => navigate(-1)}>
        ← Back
      </div>
      
      <h1>Rank Destinations</h1>
      
      <div className="voting-deadline">
        <span className="clock-icon">🕐</span>
        Voting ends in 23h
      </div>

      <p className="drag-instruction">Drag and drop to rank your preferences</p>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="destinations">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="destinations-list"
            >
              {destinations.map((destination, index) => (
                <Draggable
                  key={destination.id}
                  draggableId={destination.id}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`destination-item ${snapshot.isDragging ? 'dragging' : ''}`}
                    >
                      <div {...provided.dragHandleProps} className="drag-handle">
                        ⋮⋮
                      </div>
                      <div className="destination-image">
                        <img src={destination.image} alt={destination.name} />
                      </div>
                      <div className="destination-name">{destination.name}</div>
                      <div className="rank-arrows">
                        <button className="rank-arrow up" aria-label="Move up">↑</button>
                        <button className="rank-arrow down" aria-label="Move down">↓</button>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="submit-section">
        <button className="submit-vote-button" onClick={handleSubmitVote}>
          Submit my vote
        </button>
        <p className="edit-note">You can edit until the deadline</p>
      </div>
    </div>
  );
};

export default VotingPage; 