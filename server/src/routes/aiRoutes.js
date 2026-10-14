import express from 'express';
import { processAiIntent } from '../services/aiService.js';
import { searchLocations } from '../services/locationService.js';
import { calculateDistanceKm, estimateDurationMins, calculateFare } from '../services/fareService.js';

const router = express.Router();

router.post('/intent', async (req, res) => {
  try {
    const { message, language = 'en', conversationHistory = [], currentDraft = {} } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message text is required' });
    }

    const aiResult = await processAiIntent({
      message,
      language,
      conversationHistory,
      currentDraft
    });

    // If destination was found and fare wasn't calculated yet, enrich response with real server-calculated fare
    if (aiResult.destination && (!currentDraft.estimatedFare || aiResult.destination !== currentDraft.destination)) {
      const pickupQuery = aiResult.pickup || currentDraft.pickup || 'Chennai Central';
      const destQuery = aiResult.destination;

      const pMatches = searchLocations(pickupQuery);
      const dMatches = searchLocations(destQuery);

      const pCoord = pMatches[0] || { lat: 13.0827, lng: 80.2707 };
      const dCoord = dMatches[0] || { lat: 13.0418, lng: 80.2341 };

      const distanceKm = calculateDistanceKm(pCoord.lat, pCoord.lng, dCoord.lat, dCoord.lng);
      const durationMins = estimateDurationMins(distanceKm);
      const fareBreakdown = calculateFare(distanceKm, durationMins);

      aiResult.calculatedFare = fareBreakdown;
      aiResult.distanceKm = distanceKm;
      aiResult.durationMins = durationMins;
      aiResult.pickupCoords = { lat: pCoord.lat, lng: pCoord.lng, name: pCoord.name || pickupQuery };
      aiResult.destinationCoords = { lat: dCoord.lat, lng: dCoord.lng, name: dCoord.name || destQuery };

      // Update reply text to include the actual computed fare if it asked for confirmation
      if (aiResult.intent === 'book_ride' && !aiResult.isConfirmed) {
        if (aiResult.language === 'ta') {
          aiResult.reply = `நான் உங்கள் புறப்படும் இடத்தை குறித்துக்கொண்டேன். ${dCoord.name || destQuery} செல்வதற்கான தூரம் ${distanceKm} கி.மீ, உத்தேச கட்டணம் ₹${fareBreakdown.estimatedTotal}. சவாரியை புக் செய்யவா?`;
          aiResult.audioSpeechText = `${dCoord.name || destQuery} செல்வதற்கான உத்தேச கட்டணம் ₹${fareBreakdown.estimatedTotal}. புக் செய்யவா?`;
        } else {
          aiResult.reply = `I've mapped your route to ${dCoord.name || destQuery}. Distance is ${distanceKm} km and estimated fare is ₹${fareBreakdown.estimatedTotal}. Shall I book your ride?`;
          aiResult.audioSpeechText = `Estimated fare to ${dCoord.name || destQuery} is ₹${fareBreakdown.estimatedTotal}. Shall I book your ride?`;
        }
      }
    }

    return res.json({ success: true, data: aiResult });
  } catch (err) {
    console.error('Error in /api/ai/intent:', err);
    return res.status(500).json({ error: 'Failed to process AI voice query', details: err.message });
  }
});

export default router;
