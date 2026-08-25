// backend/controllers/dashboardController.js
const dashboardService = require('../services/dashboardService');

exports.getStats = async (req, res, next) => {
    try {
        const { en_planta, visitas_hoy, veto_activos, total_visitantes, plantaList } = await dashboardService.getStats();
        res.json({
            stats: { en_planta, visitas_hoy, veto_activos, total_visitantes },
            en_planta, visitas_hoy, veto_activos, total_visitantes,
            plantaList,
            visitantes_en_planta: plantaList
        });
    } catch (err) { next(err); }
};
