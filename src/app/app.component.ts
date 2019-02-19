import { Component, ViewEncapsulation, ViewChild } from '@angular/core';
import { DialogService } from 'systelab-components/widgets/modal/dialog/dialog.service';
import { ChangePasswordDialog } from './systelab-login/change-password-dialog.component';
import { UserService } from './common/api/user.service';
import { ApiGlobalsService } from './globals/globals.service';
import u2fApi from 'u2f-api';
import { User } from './common/model/user';
import { MessagePopupService } from 'systelab-components/widgets/modal';
import { LoginComponent } from './systelab-login/login.component';

@Component({
	selector:      'app-root',
	templateUrl:   './app.component.html',
	styleUrls:     ['app.component.scss'],
	encapsulation: ViewEncapsulation.None
})
export class AppComponent {

	public userName = '';
	public password = '';
	public name = '';
	public lastName = '';
	public currentForm = '';
	public email = '';
	public errorUserPwd = false;
	public errorUserDoesNotExist = false;
	public errorUserExist = false;
	public txtUsername = '';
	public txtRecoverProcessStarted = '';
	public pathTerms = 'http://www.werfen.com/en/terms-and-conditions';
	public pathPrivacy = 'http://www.werfen.com/en/privacy-policy';
	public isRecoveryActive = true;
	public isSignUpActive = true;
	public isLoginActive = true;
	public isLoading = false;

	@ViewChild('loginName') loginComponent:LoginComponent;
	
	public constructor(protected dialogService: DialogService, protected userService: UserService, protected apiGlobalsService: ApiGlobalsService, protected messagePopupService: MessagePopupService) {
		this.currentForm = 'login';
		this.txtUsername = 'Username';
	}

	public doLogin(event: any) {
		console.log(this.userName + ' ' + this.password);
		console.log('doLogin');
		this.isLoading = true;
		if (this.userName && this.password)
		{
			this.userService.login(this.userName, this.password)
				.subscribe(
					(response) => {
						this.apiGlobalsService.bearer = response.headers.get('Authorization').replace("\\/", "/").replace("\\/", "/");
						
						var self = this;

						u2fApi.isSupported().then( function( supported ) {
							if ( supported )
							{
								console.log(self.messagePopupService.showInformationPopup("Performing U2F action", "Please touch the flashing U2F device now. You may be prompted to allow the site permission to access your security keys. After granting permission, the device will start to blink."));
								
								var request = JSON.parse(self.apiGlobalsService.bearer);

								u2fApi.sign(request).then(function(response)
								{
									document.getElementsByTagName("modal-overlay")[0].remove();

									var block: any = response;
									block.user = self.userName;

									self.userService.login_verify(JSON.stringify(block))
									.subscribe(
										(response2) => {
											self.isLoading = false;
											self.messagePopupService.showInformationPopup("Success","User has been correctly identified");
										},
										(error) => self.showError(error));
								}).catch( function (e) {
									document.getElementsByTagName("modal-overlay")[0].remove();
									self.showError(e);
								});
							}
							else
							{
								self.showError("u2f not supported");
							}
						} )
						.catch(function (e) {
							self.showError(e);
						});
					},
					(error) => this.showError(error.message));
		}
	}

	public doSignUp(event: any) {
		console.log(this.userName + ' ' + this.password + ' ' + this.name + ' ' + this.lastName + ' ' + this.email);
		console.log('doSignUp');
		this.isLoading = true;
		if (this.userName && this.password)
		{
			let user : User = {id: "", surname: this.lastName, name: this.name, login: this.userName, password: this.password, role: 'USER'};

			this.userService.create(user)
				.subscribe(
					(response) => {
						//
						this.apiGlobalsService.bearer = response.headers.get('Authorization').replace("\\/", "/").replace("\\/", "/");
						
						var self = this;

						u2fApi.isSupported().then( function( supported ) {
							if ( supported )
							{
								console.log(self.messagePopupService.showInformationPopup("Performing U2F action", "Please touch the flashing U2F device now. You may be prompted to allow the site permission to access your security keys. After granting permission, the device will start to blink."));
								
								var request = JSON.parse(self.apiGlobalsService.bearer);

								u2fApi.register(request).then(function(response)
								{
									var block: any = response;
									block.user = user.login;

									document.getElementsByTagName("modal-overlay")[0].remove();
									self.userService.create_verify(JSON.stringify(block))
									.subscribe(
										(response2) => {
											self.isLoading = false;
											self.loginComponent.goLogin();
										},
										(error) => self.showError(error));
								}).catch( function (e) {
									document.getElementsByTagName("modal-overlay")[0].remove();
									self.showError(e);
								});
							}
							else
							{
								self.showError("u2f not supported");
							}
						} )
						.catch(function (e) {
							self.showError(e);
						});
					},
					(error) => this.showError(error.message));
		}
	}

	public doRecovery(event: any) {
		console.log(this.userName);
		this.dialogService.showDialog(ChangePasswordDialog, ChangePasswordDialog.getParameters());
		console.log('doRecovery');
		this.isLoading = true;
	}

	private showError(what: any){
		this.isLoading = false;
		this.messagePopupService.showErrorPopup("Error", what);
		console.log(what);
	}

}
