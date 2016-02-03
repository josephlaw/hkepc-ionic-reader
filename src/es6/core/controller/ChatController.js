/**
 * Created by Gaplo917 on 11/1/2016.
 */
import * as HKEPC from "../../data/config/hkepc"
import * as URLUtils from "../../utils/url"
import {GeneralHtml} from "../model/general-html"
var cheerio = require('cheerio')
var async = require('async');

export class ChatController{

  constructor($scope, $http, authService,$state,ngToast){

    this.http = $http
    this.scope = $scope
    this.chats = []
    this.ngToast = ngToast

    $scope.$on('$ionicView.loaded', (e) => {
      if(authService.isLoggedIn()){
        this.scope.$emit("accountTabUpdate",authService.getUsername())
        setTimeout(()=> this.loadChats() ,400)
      } else {
        this.ngToast.danger(`<i class="ion-alert-circled"> PM 需要會員權限，請先登入！</i>`)
        $state.go("tab.account")
      }

    })
  }

  loadChats(){
    this.http
        .get(HKEPC.forum.pmList(1))
        .then((resp) => {

          const html = new GeneralHtml(cheerio.load(resp.data))

          let $ = html
              .removeIframe()
              .processImgUrl(HKEPC.baseUrl)
              .getCheerio()

          // select the current login user
          const currentUsername = $('#umenu > cite').text()

          // send the login name to parent controller
          this.scope.$emit("accountTabUpdate",currentUsername)

          const chats = $('.pm_list li').map((i, elem) => {
            let chatSource = cheerio.load($(elem).html())


            const avatarUrl = chatSource('.avatar img').attr('src')
            const summary = chatSource('.summary').text()
            const username = chatSource('.cite cite a').text()

            chatSource('cite').remove()
            const date = chatSource('.cite').text()

            const id = URLUtils.getQueryVariable(avatarUrl,'uid')
            return {
              id: id,
              avatarUrl:avatarUrl,
              summary:summary,
              username: username,
              date : date
            }

          }).get()


          this.chats = chats

        },(err) => {
          console.log(err)
        })
  }
}