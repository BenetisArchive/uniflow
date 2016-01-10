import React, { Component } from 'react';
import clientF from './client';
var client = clientF();

export class UserApi extends Component {
    constructor(props) {
        super(props);
        this.state = { users: []};
    }

    componentDidMount() {
        client({method: 'GET', path: '/api/users'}).done(response => {
            this.setState({users: response.entity._embedded.users});
        });
    }

    render() {
        return (
            <UsersList users={this.state.users}/>
        );
    }
}

export class UsersList extends Component {
    render() {
        var users = this.props.users.map(user =>
            <User key={user._links.self.href} user={user}/>
        );
        return (
            <table>
                <tbody>
                <tr>
                    <th>Email</th>
                </tr>
                {users}
                </tbody>
            </table>
        )
    }
}

export class User extends Component {
    render() {
        return (
            <tr>
                <td>{this.props.user.email}</td>
            </tr>
        )
    }
}

export class App extends Component {
  render() {
    return (
      <div>
        <UserApi />
      </div>
    );
  }
}