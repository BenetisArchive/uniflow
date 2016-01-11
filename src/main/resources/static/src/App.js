import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import clientF from './client';
var client = clientF();
import follow from './follow';
import '../main.css';

export class UserApi extends Component {

    constructor(props) {
        super(props);
        this.state = { users: [], attributes: [], pageSize: 10, links: {}};
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

    onCreate(newUser) {
        follow(client, ['users'])
        .then(userCollection => {
            return client({
                method: 'POST',
                path: userCollection.entity._links.self.href,
                entity: newUser,
                headers: {'Content-Type': 'application/json'}
            })
        }).then(response => {
            return follow(client, [
                {rel: 'users', params: {size: this.state.pageSize}}]);
        }).done(response => {
            console.log(response.entity._links)
            this.onNavigate(response.entity._links.last.href);
        });
    }
    onNavigate(navUri) {
        client({method: 'GET', path: navUri}).done(userCollection => {
            this.setState({
                users: userCollection.entity._embedded.users,
                attributes: this.state.attributes,
                pageSize: this.state.pageSize,
                links: userCollection.entity._links
            });
        });
    }

    onDelete(user) {
        client({method: 'DELETE', path: user._links.self.href}).done(response => {
            this.loadFromServer(this.state.pageSize);
        });
    }

    updatePageSize(pageSize) {
        if (pageSize !== this.state.pageSize) {
            this.loadFromServer(pageSize);
        }
    }

    render() {
        return (
            <div>
                <CreateDialog attributes={this.state.attributes} onCreate={this.onCreate.bind(this)}/>
                <UsersList users={this.state.users}
                           links={this.state.links}
                           pageSize={this.state.pageSize}
                           onNavigate={this.onNavigate}
                           onDelete={this.onDelete.bind(this)}
                           updatePageSize={this.updatePageSize.bind(this)}/>
            </div>
        );
    }
}

export class UsersList extends Component {
    handleInput(e) {
        e.preventDefault();
        var pageSize = ReactDOM.findDOMNode(this.refs.pageSize).value;
        if (/^[0-9]+$/.test(pageSize)) {
            this.props.updatePageSize(pageSize);
        } else {
            ReactDOM.findDOMNode(this.refs.pageSize).value =
                pageSize.substring(0, pageSize.length - 1);
        }
    }
    handleNavFirst(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.first.href);
    }
    handleNavPrev(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.prev.href);
    }
    handleNavNext(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.next.href);
    }
    handleNavLast(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.last.href);
    }
    render() {
        var users = this.props.users.map(user =>
            <User key={user._links.self.href} user={user} onDelete={this.props.onDelete}/>
        );

        var navLinks = [];
        if ("first" in this.props.links) {
            navLinks.push(<button key="first" onClick={this.handleNavFirst}>&lt;&lt;</button>);
        }
        if ("prev" in this.props.links) {
            navLinks.push(<button key="prev" onClick={this.handleNavPrev}>&lt;</button>);
        }
        if ("next" in this.props.links) {
            navLinks.push(<button key="next" onClick={this.handleNavNext}>&gt;</button>);
        }
        if ("last" in this.props.links) {
            navLinks.push(<button key="last" onClick={this.handleNavLast}>&gt;&gt;</button>);
        }
        return (
            <table>
                <tbody>
                <tr>
                    <th>Email</th>
                    <th>Delete</th>
                </tr>
                {users}
                </tbody>
            </table>
        )
    }
}

export class User extends Component {
    handleDelete(e) {
        this.props.onDelete(this.props.user);
    }
    render() {
        return (
            <tr>
                <td>{this.props.user.email}</td>
                <td>
                    <button onClick={this.handleDelete.bind(this)}>Delete</button>
                </td>
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

export class CreateDialog extends Component {
    handleSubmit(e) {
        e.preventDefault();
        var newUser = {};
        this.props.attributes.forEach(attribute => {
            newUser[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
        });
        this.props.onCreate(newUser);

        // clear out the dialog's inputs
        this.props.attributes.forEach(attribute => {
            ReactDOM.findDOMNode(this.refs[attribute]).value = '';
        });

        // Navigate away from the dialog to hide it.
        window.location = "#";
    }
    render() {
        var inputs = this.props.attributes.map(attribute =>
            <p key={attribute}>
                <input type="text" placeholder={attribute} ref={attribute} className="field" />
            </p>
        );

        return (
            <div>
                <a href="#createUser">Create</a>

                <div id="createUser" className="modalDialog">
                    <div>
                        <a href="#" title="Close" className="close">X</a>

                        <h2>Create new user</h2>

                        <form>
                            {inputs}
                            <button onClick={this.handleSubmit.bind(this)}>Create</button>
                        </form>
                    </div>
                </div>
            </div>
        )
    }

}