import React from 'react';
import axios from 'axios';
import {Promise} from 'bluebird';
import {createGlobalStyle} from 'styled-components';
import styled from 'styled-components';

import TabBar from './TabBar.jsx';
import Display from './Display.jsx';

const GlobalStyle = createGlobalStyle`
  body {
    font-family: 'Poppins', sans-serif;
    font-weight: 200;
  }
`

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: start-flex;
  width: 1200px;
`

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      view: 0,
      dataLoaded: false,
      tabs: []
    };

    this.updateView = this.updateView.bind(this);
  }

  componentDidMount() {
    // Make all get requests for this listing's tours/categories when the page is loaded, so we can store the relevant information to display, already sorted, in state, and then just switch which tours/categories are displayed depending on the tab user clicks
    this.populateTabs();
  }

  fetchRecommendedTours(listingId) {
    return axios.get(`/api/listings/${listingId}/tours/categories/recommended`);
  }

  fetchCategories(listingId) {
    return axios.get(`/api/listings/${listingId}/tours/categories`);
  }

  fetchToursByCategory(listingId, categoryId) {
    return axios.get(`/api/listings/${listingId}/tours/categories/${categoryId}`);
  }

  createRecommendedTab() {
    return new Promise((resolve, reject) => {
      this.fetchRecommendedTours(this.props.listingId)
        .then(recommendedTours => {
          const recTab = {
            name: 'Recommended',
            description: 'Our most popular tours and activities',
            displayMax: 4,
            items: recommendedTours.data
          }
          resolve(recTab);
        })
        .catch(err => reject(err));
    });
  }

  createCategoryTabs(categories) {
      const categoryPromises = categories.map(category => {
        return new Promise((resolve, reject) => {
          this.fetchToursByCategory(this.props.listingId, category.id)
            .then(toursForCategory => {
              category.items = toursForCategory.data;
              category.displayMax = 4;
              resolve(category);
            })
            .catch(err => reject(err));
        })
      });
      return Promise.all(categoryPromises)
  }

  populateTabs() {
    const populatedTabs = [];
    const browseTab = {
      name: 'Browse',
      displayMax: 6
    };
    this.createRecommendedTab()
      .then(recTab => populatedTabs.push(recTab))
      .then(() => this.fetchCategories(this.props.listingId))
      .then(categories => {
        const topCategories = categories.data.slice(0, 4);
        browseTab.items = categories.data.slice(4);
        return this.createCategoryTabs(topCategories);
      })
      .then(categoryTabs => {
        categoryTabs.forEach(categoryTab => populatedTabs.push(categoryTab));
        populatedTabs.push(browseTab);
        this.setState({
          tabs: populatedTabs,
          dataLoaded: true
        });
      })
      .catch(err => console.log(err));     
  }

  updateView(newTab) {
    this.setState({
      view: newTab
    });
  }

  render() {
    return (
      <div>
        <GlobalStyle />
        <h1>Get the full experience and book a tour</h1>
        <Container>
          <TabBar tabs={this.state.tabs} currentTab={this.state.view} updateView={this.updateView}/>
          {this.state.dataLoaded ? <Display tab={this.state.tabs[this.state.view]}/> : null}
        </Container>
      </div>
    );
  }
}


export default App;