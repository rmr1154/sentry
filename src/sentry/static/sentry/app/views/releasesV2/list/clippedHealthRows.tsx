import React from 'react';
import styled from '@emotion/styled';
import {css} from '@emotion/core';

import space from 'app/styles/space';
import {t, tct} from 'app/locale';
import Button from 'app/components/button';

const defaultprops = {
  maxVisibleItems: 5,
  fadeHeight: '40px',
};

type Props = {
  children: React.ReactNode[];
  className?: string;
} & typeof defaultprops;

type State = {
  collapsed: boolean;
};

// TODO(matej): refactor to reusable component

class clippedHealthRows extends React.Component<Props, State> {
  static defaultProps = defaultprops;

  state: State = {
    collapsed: true,
  };

  reveal = () => {
    this.setState({collapsed: false});
  };

  collapse = () => {
    this.setState({collapsed: true});
  };

  render() {
    const {children, maxVisibleItems, fadeHeight, className} = this.props;
    const {collapsed} = this.state;

    const displayCollapsedButton = !collapsed && children.length > maxVisibleItems;

    return (
      <Wrapper
        className={className}
        fadeHeight={fadeHeight}
        displayCollapsedButton={displayCollapsedButton}
      >
        {children.map((item, index) => {
          if (!collapsed || index < maxVisibleItems) {
            return item;
          }

          if (index === maxVisibleItems) {
            return (
              <ShowMoreWrapper key="show-more">
                <Button
                  onClick={this.reveal}
                  priority="primary"
                  size="xsmall"
                  data-test-id="show-more"
                >
                  {tct('Show [numberOfFrames] More', {
                    numberOfFrames: children.length - maxVisibleItems,
                  })}
                </Button>
              </ShowMoreWrapper>
            );
          }
          return null;
        })}

        {displayCollapsedButton && (
          <CollapseWrapper>
            <Button
              onClick={this.collapse}
              priority="primary"
              size="xsmall"
              data-test-id="collapse"
            >
              {t('Collapse')}
            </Button>
          </CollapseWrapper>
        )}
      </Wrapper>
    );
  }
}

const absoluteButtonStyle = css`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ShowMoreWrapper = styled('div')`
  ${absoluteButtonStyle};
  background-image: linear-gradient(
    180deg,
    hsla(0, 0%, 100%, 0.15) 0,
    ${p => p.theme.white}
  );
  background-repeat: repeat-x;
  border-bottom: ${space(1)} solid ${p => p.theme.white};
  border-top: ${space(1)} solid transparent;
`;

const CollapseWrapper = styled('div')`
  ${absoluteButtonStyle};
`;

const Wrapper = styled('div')<{
  fadeHeight: string;
  displayCollapsedButton: boolean;
}>`
  position: relative;
  ${ShowMoreWrapper} {
    height: ${p => p.fadeHeight};
  }
  ${CollapseWrapper} {
    height: ${p => p.fadeHeight};
  }
  ${p => p.displayCollapsedButton && `padding-bottom: ${p.fadeHeight};`}
`;

export default clippedHealthRows;
