function createPost(loggedInUserId: string) {}

export class SDK {
  constructor(public loggedInUserId?: string) {
    this.userShouldBeLoggedIn(); // throw if loggedInUserId is undefined
    createPost(this.loggedInUserId); // still the compiler thinks loggedInUserId can be undefined

    this.assertUserIsLoggedIn(); // throw if loggedInUserId is undefined
    createPost(this.loggedInUserId); // now the compiler knows loggedInUserId is not undefined
  }

  userShouldBeLoggedIn() {
    if (!this.loggedInUserId) {
      throw new Error("User is not logged in");
    }
  }

  assertUserIsLoggedIn(): asserts this is this & { loggedInUserId: string } {
    if (!this.loggedInUserId) {
      throw new Error("User is not logged in");
    }
  }
}
