import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { toast } from 'sonner';
import { getStoredToken, updateStoredUser } from '../utils/authStorage';

export const useCurrentUser = () => {
    return useQuery({
        queryKey: ['currentUser'],
        queryFn: async () => {
            const { data } = await api.get('/user/me');
            return data.user;
        },
        enabled: Boolean(getStoredToken()),
    });
};

export const useDecks = () => {
    return useQuery({
        queryKey: ['decks'],
        queryFn: async () => {
            const { data } = await api.get('/decks');
            return data.decks || [];
        },
    });
};

export const useDeck = (id) => {
    return useQuery({
        queryKey: ['deck', id],
        queryFn: async () => {
            const { data } = await api.get(`/decks/${id}`);
            return data;
        },
        enabled: !!id,
    });
};

export const useDeleteDeckMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (deckId) => {
            const { data } = await api.delete(`/decks/${deckId}`);
            return data;
        },
        onSuccess: () => {
            toast.success('Deck deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['decks'] });
            queryClient.invalidateQueries({ queryKey: ['masteryStats'] });
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to delete deck');
        },
    });
};

export const useMasteryStats = () => {
    return useQuery({
        queryKey: ['masteryStats'],
        queryFn: async () => {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const { data } = await api.get('/analytics/mastery', {
                params: { timezone },
            });
            return data;
        },
        refetchInterval: 5 * 60 * 1000,
    });
};

export const useGradeMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ cardId, q, grade }) => {
            const normalizedGrade = q ?? grade;
            const { data } = await api.post('/study/grade', { cardId, q: normalizedGrade });
            return data;
        },
        onSuccess: (data, variables) => {
            // Optional: toast('Card graded');
            // Assuming variables.deckId exists or invalidate all active decks/cards
            queryClient.invalidateQueries({ queryKey: ['decks'] });
            queryClient.invalidateQueries({ queryKey: ['masteryStats'] });
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Error syncing grade');
        }
    });
};

export const useIngestPDF = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (formData) => {
            const { data } = await api.post('/ingest', formData);
            return data;
        },
        onSuccess: () => {
            toast.success('Deck generated successfully');
            queryClient.invalidateQueries({ queryKey: ['decks'] });
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to ingest PDF');
        }
    });
};

export const useAcceptTermsMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const { data } = await api.patch('/user/accept-terms');
            return data.user;
        },
        onSuccess: (user) => {
            updateStoredUser(user);
            queryClient.setQueryData(['currentUser'], user);
            toast.success('Terms accepted. Welcome to your dashboard.');
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Could not accept terms right now.');
        },
    });
};

export const useUpdateProfileMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload) => {
            const { data } = await api.patch('/user/profile', payload);
            return data.user;
        },
        onSuccess: (user) => {
            updateStoredUser(user);
            queryClient.setQueryData(['currentUser'], user);
            toast.success('Profile synced successfully');
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to save profile changes');
        },
    });
};
