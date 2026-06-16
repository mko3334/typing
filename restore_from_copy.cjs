const fs = require('fs');
const path = require('path');

const reconstructedPath = '/Users/motoyamayuuki/.gemini/antigravity/scratch/kids-typing-gameのコピー/src/App.jsx';
const targetPath = '/Users/motoyamayuuki/.gemini/antigravity/scratch/kids-typing-game/src/App.jsx';

const content = fs.readFileSync(reconstructedPath, 'utf8');
const lines = content.split('\n');

const jsLines = lines.slice(134); // starts with 'は': ['ha']

const header = `import React, { useState, useEffect, useRef, useCallback } from 'react';
import localforage from 'localforage';
import { Settings, Play, Info, CheckCircle2, ChevronLeft, ChevronRight, Speaker, Music, User, Star, Trophy, ArrowRight, Heart, Crown, ShoppingCart, AlertTriangle, Edit3, X, Cloud, Lock, Trash2, KeyRound } from 'lucide-react';
import confetti from 'canvas-confetti';

const ROMAJI_MAP = {
`;

const newContent = header + jsLines.join('\n');
fs.writeFileSync(targetPath, newContent, 'utf8');
console.log('Wrote clean App.jsx to ' + targetPath);
