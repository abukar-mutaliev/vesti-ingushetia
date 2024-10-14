import React from 'react';
import { useSelector } from 'react-redux';

const UserCard = () => {
    const users = useSelector((state) => state.user.users);

    return (
        <div>
            {users.map((user) => (
                <div key={user.id}>
                    <h2>{user.name}</h2>
                    <p>{user.email}</p>
                </div>
            ))}
        </div>
    );
};

export default UserCard;
