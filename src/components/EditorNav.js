import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';

export default class EditorNav extends Component {
  constructor(props) {
    super(props);
    this.onFormatClick = this.onFormatClick.bind(this);
  }

  onFormatClick(eventKey, event) {
    if (this.props.formatEnabled && this.props.onFormatClick) {
      this.props.onFormatClick(eventKey, event);
    }
  }

  render() {
    const { label, formatEnabled, formatLabel, className, moreinfo, moreinfolabel } = this.props;

    let formatlink;
    let moreinfolink;

    if (formatEnabled) {
      formatlink = (
        <Nav>
          <Nav.Link onClick={this.onFormatClick}>{formatLabel}</Nav.Link>
        </Nav>
      );
    }
    if (moreinfo) {
      moreinfolink = (
        <Nav.Link href={moreinfo} target="_blank">
          <div className="font-weight-light">{moreinfolabel}</div>
        </Nav.Link>
      );
    }

    return (
      <div className={className}>
        <Navbar className="py-0 mt-0" bg="light" variant="light">
          <Nav className="mr-auto">
            <Navbar.Text className="">{<strong>{label}</strong>}</Navbar.Text>
            {moreinfolink}
          </Nav>
          {formatlink}
        </Navbar>
      </div>
    );
  }
}

EditorNav.propTypes = {
  label: PropTypes.string,
  formatEnabled: PropTypes.bool,
  formatLabel: PropTypes.string,
  onFormatClick: PropTypes.func,
  className: PropTypes.string,
};

EditorNav.defaultProps = {
  label: 'Header',
  formatEnabled: true,
  formatLabel: 'Format',
  onFormatClick: function () {},
  className: 'editor-nav',
};
