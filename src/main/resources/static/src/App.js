import React, { Component } from 'react';
import client from './client';

export class UserApi extends Component {
    getInitialState() {
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
        var employees = this.props.users.map(user =>
            <User key={user._links.self.href} user={user}/>
        );
        return (
            <table>
                <tr>
                    <th>Email</th>
                </tr>
                {users}
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