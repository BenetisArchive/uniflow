import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import clientF from './client';
var client = clientF();
import follow from './follow';
import '../main.css';
import when from 'when';

export class UserApi extends Component {

    constructor(props) {
        super(props);
        this.state = { users: [], attributes: [], pageSize: 5, links: {}};
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
        }).then(userCollection => {
            return userCollection.entity._embedded.users.map(user =>
                client({
                    method: 'GET',
                    path: user._links.self.href
                })
            );
        }).then(usersPromises => {
            return when.all(usersPromises);
        }).done(users => {
            this.setState({
                users: users,
                attributes: Object.keys(this.schema.properties),
                pageSize: pageSize
            });
            this.forceUpdate(); //some kind of rare optimization -https://github.com/facebook/react/issues/4067
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

    onUpdate(user, updatedUsers) {
        client({
            method: 'PUT',
            path: user.entity._links.self.href,
            entity: updatedUsers,
            headers: {
                'Content-Type': 'application/json',
                'If-Match': user.headers.Etag
            }
        }).done(response => {
            this.loadFromServer(this.state.pageSize);
        }, response => {
            if (response.status.code === 412) {
                alert('DENIED: Unable to update ' +
                    user.entity._links.self.href + '. Your copy is stale.');
            }
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
                           attributes={this.state.attributes}
                           onNavigate={this.onNavigate.bind(this)}
                           onDelete={this.onDelete.bind(this)}
                           onUpdate={this.onUpdate.bind(this)}
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
            <User key={user.entity._links.self.href}
                  user={user}
                  attributes={this.props.attributes}
                  onUpdate={this.props.onUpdate}
                  onDelete={this.props.onDelete}/>
        );

        var navLinks = [];
        if ("first" in this.props.links) {
            navLinks.push(<button key="first" onClick={this.handleNavFirst.bind(this)}>&lt;&lt;</button>);
        }
        if ("prev" in this.props.links) {
            navLinks.push(<button key="prev" onClick={this.handleNavPrev.bind(this)}>&lt;</button>);
        }
        if ("next" in this.props.links) {
            navLinks.push(<button key="next" onClick={this.handleNavNext.bind(this)}>&gt;</button>);
        }
        if ("last" in this.props.links) {
            navLinks.push(<button key="last" onClick={this.handleNavLast.bind(this)}>&gt;&gt;</button>);
        }
        return (
            <div>
                <table>
                    <tbody>
                    <tr>
                        <th>Email</th>
                        <th>Update</th>
                        <th>Delete</th>
                    </tr>
                    {users}
                    </tbody>
                </table>
                <div>
                    {navLinks}
                </div>
            </div>
        )
    }
}

export class User extends Component {
    handleDelete(e) {
        this.props.onDelete(this.props.user);
    }
    render() {
        console.log(this.props)
        return (
            <tr>
                <td>{this.props.user.entity.email}</td>
                <td>
                    <UpdateDialog user={this.props.user}
                                  attributes={this.props.attributes}
                                  onUpdate={this.props.onUpdate}/>
                </td>
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

export class UpdateDialog extends Component {
    handleSubmit(e) {
        e.preventDefault();
        var updatedUser = {};
        this.props.attributes.forEach(attribute => {
            updatedUser[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
        });
        this.props.onUpdate(this.props.user, updatedUser);
        window.location = "#";
    }

    render() {
        var inputs = this.props.attributes.map(attribute =>
            <p key={this.props.user.entity[attribute]}>
                <input type="text" placeholder={attribute}
                       defaultValue={this.props.user.entity[attribute]}
                       ref={attribute} className="field" />
            </p>
        );

        var dialogId = "updateUser-" + this.props.user.entity._links.self.href;

        return (
            <div key={this.props.user.entity._links.self.href}>
                <a href={"#" + dialogId}>Update</a>
                <div id={dialogId} className="modalDialog">
                    <div>
                        <a href="#" title="Close" className="close">X</a>

                        <h2>Update user</h2>

                        <form>
                            {inputs}
                            <button onClick={this.handleSubmit.bind(this)}>Update</button>
                        </form>
                    </div>
                </div>
            </div>
        )
    }

}