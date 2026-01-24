import Message from '../models/Message.js';


export const getPartnerUnreadCount = async (req, res) => {
    try {
        // console.log("checking for req.user and params:", req.session.user, req.params);
        const currentUserId = req.session.user.id;
        const partnerId = req.params.partnerId;

        const count = await Message.countDocuments({
            receiver: currentUserId,
            sender: partnerId,
            status: 1
        });

        res.json({ unreadCount: count });
    } catch (error) {
        console.error("Error fetching partner unread count:", error);
        res.status(500).json({ error: "Server error" });
    }
};