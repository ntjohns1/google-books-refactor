const { AuthenticationError } = require('apollo-server-express');
const { User, Product } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        users: async () => {
            return User.find();
        },

        user: async (parent, { userId }) => {
            return User.findOne({ _id: userId });
        },
        me: async (parent, args, context) => {
            if (context.user) {
               
                return Profile.findOne({ _id: context.user._id });
            }
            
            throw new AuthenticationError('You need to be logged in!');
        },
    },

    Mutation: {
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });
            if (!user) {
                throw new AuthenticationError('No User with this name found!');
            }
            const correctPw = await user.isCorrectPassword(password);
            if (!correctPw) {
                throw new AuthenticationError('Incorrect password!');
            }
            
            const token = signToken(user);
            
            return { token, user };
        },

        addUser: async (parent, { username, password, email }) => {
            const user = await User.create({ username, password, email });
            const token = signToken(user);
           
            return { token, user };
        },

        saveBook: async (parent, args, context) => {
            if (context.user) {
                const updatedUser = await User.findByIdAndUpdate(
                    { _id: context.user._id },
                    { $addToSet: { savedBooks: args.input } },
                    { new: true, runValidators: true }
                );
                return updatedUser;
            }
            throw new AuthenticationError('Please Login First!');
        },

        removeBook: async (parent, { bookId }, context) => {
            if (context.user) {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $pull: { savedBooks: { bookId } } },
                    { new: true }
                );
                return updatedUser;
            }
            throw new AuthenticationError('Please Login First!');
        },
    },
};


module.exports = resolvers;