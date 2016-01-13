/**
 * Created by Gaplo917 on 11/1/2016.
 */
import * as HKEPC from "../../data/config/hkepc"
import * as URLUtils from "../../utils/url"
import {GeneralHtml} from "../model/general-html"
var cheerio = require('cheerio')
var async = require('async');

export class PostListController {

  constructor($scope,$http,$stateParams,$location,$anchorScroll) {
    "use strict";
    console.log("called POST LIST CONTROLLER")
    $scope.vm = this;
    this.scope = $scope
    this.http = $http
    this.location = $location
    this.anchorScroll = $anchorScroll

    this.topicId = $stateParams.topicId
    this.page = $stateParams.page
    this.pages = []
    this.slidePages = []
    this.currentIndex = 0
    this.currentPageNum = 0

    // create a UI rendering queue
    this.q = async.queue((task, callback) => {

      // update the post list
      const post = task()
      if(post.id || post.id != ""){
        this.pages.find(p => p.num == post.pageNum).posts.push(post)
      }

      if(this.q.length() % 3 == 0){
        // force update the view after 10 task
        this.scope.$apply()
      }

      setTimeout(() => callback(), 50)
    }, 1);

    this.scope.$on('$ionicView.loaded', (e) => {
      this.loadMore()
    })
  }

  loadMore(cb){
    const nextPage = this.currentPageNum + 1
    this.http
        .get(HKEPC.forum.topics(this.topicId, nextPage))
        .then((resp) => {

          let $ = cheerio.load(resp.data)
          const topicName = $('#nav').text().split('»')[1]

          const tasks = $('.threadlist table tbody').map( (i, elem) => {
            return () => {

              let postSource = cheerio.load($(elem).html())

              return {
                id: URLUtils.getQueryVariable(postSource('tr .subject span a').attr('href'), 'tid'),
                tag: postSource('tr .subject em a').text(),
                name: postSource('tr .subject span a').text(),
                author: {
                  name: postSource('tr .author a').text()
                },
                count: {
                  view: postSource('tr .nums em').text(),
                  reply: postSource('tr .nums strong').text()
                },
                publishDate: postSource('tr .author em').text(),
                pageNum: this.pages.length
              }
            }
          }).get()

          this.q.push(tasks)

          // when all task finished
          this.q.drain = () => {

            this.scope.$apply()
            this.scope.$broadcast('scroll.infiniteScrollComplete')
          }

          // push into the array
          this.pages.push({
            posts: [],
            num: nextPage
          })

          if(this.currentIndex == 0){
            this.slidePages[0] = this.pages[0]
          }

          this.topic = {
            id: this.topicId,
            name: topicName
          }

          if(cb) cb(null)
          // For JSON responses, resp.data contains the result
        }, (err) => {
          console.error('ERR', JSON.stringify(err))
          cb(err)
          // err.status will contain the status code
        })
  }

  reset(){
    this.q.kill()
    this.pages = []
  }

  doRefresh(){
    this.reset()
    this.loadMore(() => {
      this.scope.$broadcast('scroll.refreshComplete');
    })
  }

  onSlideChanged(index){
    //scroll to the hash tag
    this.location.hash(`ionic-slide-${index}`);
    this.anchorScroll();

    const diff = this.currentIndex - index
    const pagesNums = this.pages.map(p => p.num)
    this.currentPageNum = this.slidePages[this.currentIndex].num

    if(diff == 1 || diff == -2){
      // previous page, i.e.  2 -> 1 , 1 -> 0 , 0 -> 2
      const smallestPageNum = Math.min.apply(Math, pagesNums)

      if(this.currentPageNum > smallestPageNum){
        console.log("default previous page")
        this.slidePages[index] = this.pages.find(page => page.num == this.currentPageNum - 1)
      }
      else{
        console.log("loadMore Before()")
        if(this.currentPageNum == 1){

        }
        //this.slidePages[index] = []
        //this.loadMore(() => {
        //  const len = this.pages.length -1
        //  const nextPage = Math.floor(len / 3) * 3 + index
        //  this.slidePages[index] = this.pages[nextPage]
        //
        //})
        //this.slidePages[index] = this.pages.find(p => p.num == this.currentPageNum + 1)
        //this.scope.$apply()
      }

      this.scope.$apply()

    }
    else{
      // next page
      const largestPageNum = Math.max.apply(Math, pagesNums)

      if(this.currentPageNum >= largestPageNum){
        console.log("loadMore After()")
        this.slidePages[index] = []
        this.loadMore(() => {
          const len = this.pages.length -1
          const nextPage = Math.floor(len / 3) * 3 + index
          this.slidePages[index] = this.pages[nextPage]

        })

      }
      else{
        console.log("default next page")
        this.slidePages[index] = this.pages.find(p => p.num == this.currentPageNum + 1)
        this.scope.$apply()
      }

    }

    this.currentIndex = index

    console.log(this.pages)
    console.log(`onSlideChanged${index}`)
  }

}