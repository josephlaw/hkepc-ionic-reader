/**
 * Created by Gaplo917 on 27/1/2016.
 */
import * as HKEPC from '../../data/config/hkepc'
import * as URLUtils from '../../utils/url'
const cheerio = require('cheerio')

export class AuthService {
  static get NAME() { return 'AuthService' }

  static get DI() {
    return (LocalStorageService,ngToast,rx, apiService) => new AuthService(LocalStorageService,ngToast,rx, apiService)
  }

  constructor(LocalStorageService,ngToast,rx,apiService) {
    this.localStorageService = LocalStorageService
    this.ngToast = ngToast
    this.rx = rx
    this.apiService = apiService
  }

  saveAuthority(authority) {
    // remove the password before save
    delete authority['password']
    delete authority['securityQuestionAns']
    delete authority['securityQuestionId']

    return this.localStorageService.setObject('authority',authority)
  }

  removeAuthority(){
   return this.localStorageService.setObject('authority',{})
  }

  getUsername() {
    return this.localStorageService.getObject('authority')
      .map(authority => {
        if(authority && authority.username){
          return authority.username.trim()
        }
        else {
          return undefined
        }
      })
  }

  isLoggedIn() {
    return this.localStorageService.get(HKEPC.auth.id)
  }

  login (authority,cb) {
    if(authority && authority.username && authority.password){
      console.log('[AuthService]','Request login')

      this.apiService.login(authority)
        .subscribe((resp) => {
          const $ = cheerio.load(resp.data)
          const currentUsername = $('#umenu > cite').text()
          const formhash = $(`input[name='formhash']`).attr('value')

          if(currentUsername){
            this.localStorageService.set(HKEPC.auth.id,"dummy_val_for_non_proxied_client")
            this.localStorageService.set(HKEPC.auth.formhash,formhash)

            requestAnimationFrame(() => {
              this.ngToast.success(`<i class="ion-ios-checkmark"> ${currentUsername} 登入成功! </i>`)
            })
            if(cb) cb(null,currentUsername)
          } else {
            requestAnimationFrame(() => {
              this.ngToast.danger(`<i class="ion-alert-circled"> 登入失敗! </i>`)
            })
            cb("Fail!")
          }

        })

    }
  }

  logout () {
    this.localStorageService.set(HKEPC.auth.id,undefined)
    this.removeAuthority()

    // must be success
    const formhash = this.localStorageService.get(HKEPC.auth.formhash)
    this.apiService.logout(formhash).subscribe(() => {
      // useful for Native App handling
      this.localStorageService.set('tabLoginName', undefined)
    })
  }

}

