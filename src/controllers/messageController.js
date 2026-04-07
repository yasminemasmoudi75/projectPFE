const { Message, sequelize } = require('../models');
const { Op } = require('sequelize');

// Message controller

exports.getAllMessages = async (req, res, next) => {
  try {
    const filterHelper = require('../utils/filterHelper');
    
    // Module 28 = Messages (Table-driven filters from TabRoleFilterVisibility)
    const { where, limit, offset, page } = await filterHelper.applyTableDrivenFiltersWithPagination(
        '28',
        req.query,
        req.user
    );

    const { count, rows } = await Message.findAndCountAll({
      where,
      order: [['SendingDate', 'DESC']],
      limit,
      offset
    });

    res.status(200).json(
      filterHelper.formatPaginatedResponse(rows, count, page, limit)
    );
  } catch (error) {
    next(error);
  }
};

exports.getMessageById = async (req, res, next) => {
  try {
    res.status(200).json({ status: 'success', message: 'Détails message - À implémenter', data: null });
  } catch (error) {
    next(error);
  }
};

exports.createMessage = async (req, res, next) => {
  try {
    res.status(201).json({ status: 'success', message: 'Message créé - À implémenter' });
  } catch (error) {
    next(error);
  }
};

exports.deleteMessage = async (req, res, next) => {
  try {
    res.status(200).json({ status: 'success', message: 'Message supprimé - À implémenter' });
  } catch (error) {
    next(error);
  }
};

