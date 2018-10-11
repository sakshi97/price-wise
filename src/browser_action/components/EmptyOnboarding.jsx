/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import autobind from 'autobind-decorator';
import React from 'react';

import TrackProductButton from 'commerce/browser_action/components/TrackProductButton';
import config from 'commerce/config';
import {extractedProductShape} from 'commerce/state/products';

import 'commerce/browser_action/components/EmptyOnboarding.css';

/**
 * Component shown when no products are currently being tracked.
 */
@autobind
export default class EmptyOnboarding extends React.Component {
  static propTypes = {
    // Direct props
    extractedProduct: extractedProductShape,
  }

  static defaultProps = {
    extractedProduct: null,
  }

  constructor(props) {
    super(props);
    this.state = {
      learnMoreHref: null,
    };
  }

  /**
   * Fetch the link to the support page on mount, since we can't fetch it async
   * during the render.
   */
  async componentDidMount() {
    this.setState({
      learnMoreHref: await config.get('supportUrl'),
    });
  }

  /**
   * Open a new tab and close the popup when links are clicked.
   */
  handleClick(event) {
    if (event.target.href) {
      event.preventDefault();
      browser.tabs.create({url: event.target.href});
      window.close();
    }
  }

  render() {
    const {extractedProduct} = this.props;
    const {learnMoreHref} = this.state;
    return (
      <div className="empty-onboarding" onClick={this.handleClick}>
        <img className="hero" src={browser.extension.getURL('img/shopping-welcome.svg')} alt="" />
        {/*
          JSX deviates from HTML and removes newlines separating text nodes and components:
          https://reactjs.org/blog/2014/02/20/react-v0.9.html#jsx-whitespace

          We could futz with the margin on these components, but that would depend on how they're
          laid out here, which involves coordinating two files. The one-file solution is to add
          {' '} in the spots where whitespace would otherwise be collapsed.
        */}
        <p className="description">
          Add products you want to buy from
          {' '}<a href="https://www.amazon.com">Amazon</a>,
          {' '}<a href="https://www.bestbuy.com/">Best Buy</a>,
          {' '}<a href="https://www.ebay.com/">eBay</a>,
          {' '}<a href="https://www.homedepot.com/">Home Depot</a>, and
          {' '}<a href="https://www.walmart.com/">Walmart</a>
          {' '}to your Price Watcher list, and Firefox will notify you if the price drops.
        </p>
        <a href={learnMoreHref} className="learn-more">Learn More</a>
        <TrackProductButton className="button" extractedProduct={extractedProduct} />
      </div>
    );
  }
}