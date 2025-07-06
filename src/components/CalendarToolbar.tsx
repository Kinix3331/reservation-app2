// src/components/CalendarToolbar.tsx
import React from 'react';
import { ToolbarProps, NavigateAction, View } from 'react-big-calendar';
import { ButtonGroup, Button, Dropdown } from 'react-bootstrap';
import moment from 'moment';
import { CalendarEvent } from '../types/models';

// Definiujemy propsy specyficzne dla naszej niestandardowej logiki
interface CustomToolbarSpecificProps {
  currentYear: number;
  onYearChange: (year: number) => void;
}

// Łączymy ToolbarProps z naszymi CustomToolbarSpecificProps
// Komponent Toolbar otrzyma wszystkie propsy z ToolbarProps ORAZ nasze customowe propsy
type MergedToolbarProps = ToolbarProps<CalendarEvent, object> & CustomToolbarSpecificProps;

// Używamy MergedToolbarProps dla komponentu
const CalendarToolbar: React.FC<MergedToolbarProps> = (toolbar) => {
  const navigate = (action: NavigateAction) => {
    toolbar.onNavigate(action);
  };

  const view = (newView: View) => {
    toolbar.onView(newView);
    // Jeśli zmieniamy widok z agendy na inny, resetujemy datę do bieżącej
    if (toolbar.view === 'agenda' && newView !== 'agenda') {
      toolbar.onNavigate('TODAY');
    }
  };

  const label = toolbar.label || '';

  const baseYear = toolbar.currentYear;
  // Generujemy listę lat wokół bieżącego roku dla dropdowna
  const years = Array.from({ length: 11 }, (_, i) => baseYear - 5 + i);

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

      <div className="d-flex align-items-center">
        {/* Dropdown wyboru roku, widoczny tylko w widoku 'agenda' */}
        {toolbar.view === 'agenda' && (
          <Dropdown as={ButtonGroup} className="me-2">
            <Dropdown.Toggle variant="secondary" id="dropdown-year-toggle">
              Rok: {toolbar.currentYear}
            </Dropdown.Toggle>
            <Dropdown.Menu className="scrollable-dropdown-menu">
              {years.map((year) => (
                <Dropdown.Item key={year} onClick={() => toolbar.onYearChange(year)} active={year === toolbar.currentYear}>
                  {year}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        )}

        {/* Dropdown wyboru widoku */}
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
            <Dropdown.Item onClick={() => view('day')}>Dzień</Dropdown.Item>
            <Dropdown.Item onClick={() => view('agenda')}>Agenda</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </div>
  );
};

export default CalendarToolbar;