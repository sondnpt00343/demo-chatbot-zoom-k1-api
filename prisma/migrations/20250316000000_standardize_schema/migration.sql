-- Standardize schema: model names PascalCase singular, tables plural lowercase, n-n join = table1_table2
-- Drop foreign keys first (MySQL may have lowercased table/constraint names)
ALTER TABLE `ConversationUser` DROP FOREIGN KEY `ConversationUser_conversationId_fkey`;
ALTER TABLE `ConversationUser` DROP FOREIGN KEY `ConversationUser_userId_fkey`;
ALTER TABLE `Message` DROP FOREIGN KEY `Message_conversationId_fkey`;
ALTER TABLE `Message` DROP FOREIGN KEY `Message_senderId_fkey`;

-- Rename tables (preserve data)
RENAME TABLE `User` TO `users`;
RENAME TABLE `Conversation` TO `conversations`;
RENAME TABLE `ConversationUser` TO `user_conversation`;
RENAME TABLE `Message` TO `messages`;

-- Re-add foreign keys
ALTER TABLE `user_conversation` ADD CONSTRAINT `user_conversation_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `user_conversation` ADD CONSTRAINT `user_conversation_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `messages` ADD CONSTRAINT `messages_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `conversations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `messages` ADD CONSTRAINT `messages_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
