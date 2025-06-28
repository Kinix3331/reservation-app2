// src/components/CalendarToolbar.tsx
import React from 'react';
import { ToolbarProps, NavigateAction, View } from 'react-big-calendar';
import { ButtonGroup, Button, Dropdown } from 'react-bootstrap';
import moment from 'moment';

const CalendarToolbar: React.FC<ToolbarProps> = (toolbar) => {
  const navigate = (action: NavigateAction) => {
    toolbar.onNavigate(action);
  };

  const view = (newView: View) => {
    toolbar.onView(newView);
  };

  const label = toolbar.label || '';

  return (
    <div className="rbc-toolbar mb-3 d-flex justify-content-between align-items-center">
      <ButtonGroup>
        <Button variant="outline-secondary" onClick={() => navigate('PREV')}>Poprzedni</Button>
        <Button variant="outline-secondary" onClick={() => navigate('TODAY')}>Dziś</Button>
        <Button variant="outline-secondary" onClick={() => navigate('NEXT')}>Następny</Button>
      </ButtonGroup>

      <h3 className="rbc-toolbar-label mb-0 mx-2 text-primary">
        {label}
      </h3>

      <Dropdown as={ButtonGroup}>
        <Dropdown.Toggle variant="primary" id="dropdown-view-toggle">
          {toolbar.view === 'month' && 'Miesiąc'}
          {toolbar.view === 'week' && 'Tydzień'}
          {toolbar.view === 'day' && 'Dzień'}
          {toolbar.view === 'agenda' && 'Agenda'}
        </Dropdown.Toggle>

        <Dropdown.Menu>
          <Dropdown.Item onClick={() => view('month')}>Miesiąc</Dropdown.Item>
          <Dropdown.Item onClick={() => view('week')}>Tydzień</Dropdown.Item>
          <Dropdown.Item onClick={() => view('day')}>Dzień</Dropdown.Item> {/* TUTAJ JEST POPRAWKA LITERÓWKI */}
          <Dropdown.Item onClick={() => view('agenda')}>Agenda</Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
};

export default CalendarToolbar;
export {};