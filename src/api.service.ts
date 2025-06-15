import { Injectable, signal } from '@angular/core';

const initialLoginStatus = {
  loggedIn: false,
  loginError: false,
  id: "",
  username: "",
  token: ""
};

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = "http://webp-ilv-backend.cs.technikum-wien.at/messenger/";

  private _loginStatus = signal(initialLoginStatus);
  public loginStatus = this._loginStatus.asReadonly();

  // FIXED: Removed empty constructor

  async login(username: string, password: string) {
    const url = `${this.apiUrl}login.php`;

    const formData = new FormData();
    formData.append("username_or_email", username);
    formData.append("password", password);

    const resp = await fetch(url, {
      method: "POST",
      body: formData,
    });
    const data = await resp.json();

    if (!data.error) {
      this._loginStatus.set({
        loggedIn: true,
        loginError: false,
        id: data.id,
        username: username,
        token: data.token
      })
    }
  }

  logout() {
    this._loginStatus.set(initialLoginStatus);
  }
}