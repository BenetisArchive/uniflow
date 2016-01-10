import React, { Component } from 'react';
import clientF from './client';
var client = clientF();
import follow from './follow';

export class UserApi extends Component {
    constructor(props) {
        super(props);
        this.state = { users: []};
        this.state.pageSize = 2;
    }

    componentDidMount() {
        this.loadFromServer(this.state.pageSize);
    }

    loadFromServer(pageSize) {
        follow(client, [
            {rel: 'users', params: {size: pageSize}}]
        ).then(userCollection => {
            return client({
                method: 'GET',
                path: userCollection.entity._links.profile.href,
                headers: {'Accept': 'application/schema+json'}
            }).then(schema => {
                this.schema = schema.entity;
                return userCollection;
            });
        }).done(userCollection => {
            this.setState({
                users: userCollection.entity._embedded.users,
                attributes: Object.keys(this.schema.properties),
                pageSize: pageSize,
                links: userCollection.entity._links});
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